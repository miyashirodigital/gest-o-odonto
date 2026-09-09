import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Supabase Configuration
const SUPABASE_DEFAULT_URL = 'https://ywsrmwslcyevvwuotwpu.supabase.co';
const SUPABASE_DEFAULT_KEY = 'sb_publishable_0aT9kjM33THbbFvpuz-j_g_sYacrfBO';

function getNormalizedSupabaseUrl(url?: string): string {
  const target = url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
  return target.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

function getServerSupabaseClient() {
  const url = getNormalizedSupabaseUrl();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_KEY).trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

const DENTAL_SYSTEM_INSTRUCTION = `Você é o "OdontoMentor IA", um mentor ágil, amigável e especialista em Odontologia.

REGRAS DE RESPOSTA E VELOCIDADE:
- Seja RÁPIDO, DIRETO e OBJETIVO. Vá direto ao ponto sem introduções longas.
- Para saudações ("oi", "olá", "tudo bem?"): responda em 1 a 2 frases curtas, simpáticas e prestativas, convidando o acadêmico a fazer perguntas ou tirar dúvidas.
- Para dúvidas clínicas (doses de anestésicos, protocolos, cirurgia, endodontia, periodontia, dentística): forneça imediatamente a resposta prática, a sequência passo a passo ou o cálculo exato com as referências-chave (Baratieri, Malamed, Cohen, Lindhe, Hupp, Neville). Use tópicos curtos e negrito.`;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      geminiClient = new GoogleGenAI({
        apiKey: apiKey || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return geminiClient;
  }

  // Helper to build contents
  function buildContents(prompt: string, specialty?: string, patientContext?: any, conversationHistory?: any[]) {
    let contextualPrompt = prompt;

    if (specialty && specialty !== 'Todas') {
      contextualPrompt = `[Área: ${specialty}]\n${contextualPrompt}`;
    }

    if (patientContext) {
      contextualPrompt = `[Paciente Vinculado:\n- Nome: ${patientContext.name || 'Anônimo'}\n- Idade: ${patientContext.age || 'Não informado'}\n- Disciplina: ${patientContext.discipline || 'Geral'}\n- Anamnese/Alergias: ${JSON.stringify(patientContext.anamnese || {})}\n- Procedimentos Prévios: ${patientContext.evolutionsSummary || 'Nenhum'}]\n\nMensagem/Dúvida:\n${contextualPrompt}`;
    }

    let contents: any = contextualPrompt;

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const historyParts = conversationHistory.slice(-8).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      historyParts.push({
        role: 'user',
        parts: [{ text: contextualPrompt }]
      });
      contents = historyParts;
    }

    return contents;
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Streaming endpoint for ultra-fast typewriter responses
  app.post('/api/gemini/dental-tutor/stream', async (req, res) => {
    try {
      const { prompt, specialty, patientContext, conversationHistory } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt é obrigatório.' });
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const ai = getGeminiClient();
      const contents = buildContents(prompt, specialty, patientContext, conversationHistory);

      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.7-flash',
        'gemini-3.1-pro-preview'
      ];
      let streamSucceeded = false;
      let lastErr: any = null;

      for (const modelName of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const responseStream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: {
                systemInstruction: DENTAL_SYSTEM_INSTRUCTION,
                temperature: 0.6,
              }
            });

            for await (const chunk of responseStream) {
              const chunkText = chunk.text;
              if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
              }
            }

            streamSucceeded = true;
            break;
          } catch (modelErr: any) {
            lastErr = modelErr;
            const errMsg = String(modelErr?.message || modelErr || '');
            console.warn(`Streaming attempt with ${modelName} (attempt ${attempt + 1}) failed:`, errMsg);
            const isRetryable = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
            
            if (isRetryable && attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 400));
            } else {
              break;
            }
          }
        }

        if (streamSucceeded) break;
      }

      if (!streamSucceeded) {
        res.write(`data: ${JSON.stringify({ error: lastErr?.message || 'Erro ao conectar ao modelo de IA.' })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('Error in streaming dental AI response:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Erro no servidor' });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  });

  // Standard non-streaming endpoint fallback
  app.post('/api/gemini/dental-tutor', async (req, res) => {
    try {
      const { prompt, specialty, patientContext, conversationHistory } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt é obrigatório.' });
      }

      const ai = getGeminiClient();
      const contents = buildContents(prompt, specialty, patientContext, conversationHistory);

      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.7-flash',
        'gemini-3.1-pro-preview'
      ];
      let lastError: any = null;
      let text: string | null = null;

      for (const modelName of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: DENTAL_SYSTEM_INSTRUCTION,
                temperature: 0.6,
              }
            });

            if (response && response.text) {
              text = response.text;
              break;
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            const errMsg = String(modelErr?.message || modelErr || '');
            const isTransient = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
            
            if (isTransient && attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              break;
            }
          }
        }

        if (text) break;
      }

      if (!text) {
        throw lastError || new Error('Não foi possível obter resposta no momento.');
      }

      return res.json({ response: text });
    } catch (err: any) {
      console.error('Error generating dental AI tutor response:', err);
      return res.status(500).json({ 
        error: err.message || 'Erro ao processar consulta com o Mentor Odonto IA.' 
      });
    }
  });

  // --- Persistent Real-time Multi-Device Sync Store (Server-Sent Events & Disk Persistence) ---
  const DATA_DIR = path.join(process.cwd(), 'data');
  const DATA_FILE = path.join(DATA_DIR, 'clinic_sync_state.json');

  interface ClinicSyncState {
    patients?: any[];
    appointments?: any[];
    tasks?: any[];
    chatMessages?: any[];
    disciplines?: any[];
    notices?: any[];
    studySubjects?: any[];
    examSchedules?: any[];
    googleResources?: any[];
    student?: any;
    dupla?: any;
    settings?: any;
    updatedAt: number;
    updatedBy?: string;
  }

  let globalSyncState: ClinicSyncState = {
    updatedAt: Date.now()
  };

  // Load persistent state from disk on server startup
  function loadPersistedState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            globalSyncState = {
              ...globalSyncState,
              ...parsed
            };
            console.log(`[Sync] Loaded persistent clinic state with ${(globalSyncState.patients || []).length} patients and ${(globalSyncState.appointments || []).length} appointments.`);
          }
        }
      }
    } catch (err) {
      console.warn('[Sync] Could not read persistent sync file:', err);
    }
  }

  function persistStateToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(globalSyncState, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Sync] Could not write persistent sync file:', err);
    }
  }

  loadPersistedState();

  // Connected clients list for SSE
  const sseClients = new Set<express.Response>();

  function broadcastSSE(data: any, exceptRes?: express.Response) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      if (client !== exceptRes) {
        try {
          client.write(payload);
        } catch {
          sseClients.delete(client);
        }
      }
    }
  }

  // SSE Stream endpoint for real-time live sync on mobile & desktop
  app.get('/api/sync/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Send current initial state on connection
    res.write(`data: ${JSON.stringify({ type: 'init', state: globalSyncState, connectedClients: sseClients.size })}\n\n`);

    // Keep connection alive with heartbeat every 20s
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeatTimer);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
      broadcastSSE({ type: 'presence', connectedClients: sseClients.size });
    });

    broadcastSSE({ type: 'presence', connectedClients: sseClients.size });
  });

  // Get current state
  app.get('/api/sync/state', (req, res) => {
    res.json({
      success: true,
      state: globalSyncState,
      connectedDevices: sseClients.size
    });
  });

  // Push state updates from any device (phone, laptop, etc.)
  app.post('/api/sync/state', (req, res) => {
    try {
      const updates = req.body;
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Formato de dados inválido' });
      }

      globalSyncState = {
        ...globalSyncState,
        ...updates,
        updatedAt: Date.now()
      };

      persistStateToDisk();

      // Broadcast immediately to all connected phones/desktops
      broadcastSSE({
        type: 'state_update',
        state: globalSyncState,
        senderId: updates.senderId,
        source: updates.source || 'device'
      });

      return res.json({
        success: true,
        updatedAt: globalSyncState.updatedAt,
        connectedDevices: sseClients.size
      });
    } catch (err: any) {
      console.error('Sync error:', err);
      return res.status(500).json({ error: err.message || 'Erro ao sincronizar' });
    }
  });

  // Direct chat message push endpoint for immediate delivery
  app.post('/api/chat/message', (req, res) => {
    try {
      const { message } = req.body;
      if (!message || (!message.content && !message.text)) {
        return res.status(400).json({ error: 'Mensagem inválida' });
      }

      const currentMessages = Array.isArray(globalSyncState.chatMessages) ? globalSyncState.chatMessages : [];
      // avoid duplicates by ID
      const exists = currentMessages.some((m: any) => m.id === message.id);
      const updatedMessages = exists ? currentMessages : [...currentMessages, message];

      globalSyncState.chatMessages = updatedMessages;
      globalSyncState.updatedAt = Date.now();

      persistStateToDisk();

      // Broadcast to all clients instantly
      broadcastSSE({
        type: 'new_chat_message',
        message,
        chatMessages: updatedMessages
      });

      return res.json({ success: true, message });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- Supabase Integration Endpoints ---
  app.get('/api/supabase/status', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      const url = getNormalizedSupabaseUrl();
      if (!client) {
        return res.json({
          connected: false,
          url,
          tablesAvailable: { clinic_sync: false, patients: false, appointments: false, tasks: false },
          hasAnyTable: false,
          error: 'Credenciais do Supabase não configuradas no servidor.'
        });
      }

      const tables = {
        clinic_sync: false,
        patients: false,
        appointments: false,
        tasks: false
      };

      let lastError: string | undefined;

      const { error: syncErr } = await client.from('clinic_sync').select('id').limit(1);
      if (!syncErr) tables.clinic_sync = true;
      else if (syncErr.code !== 'PGRST205') lastError = syncErr.message;

      const { error: patErr } = await client.from('patients').select('id').limit(1);
      if (!patErr) tables.patients = true;
      else if (patErr.code !== 'PGRST205') lastError = patErr.message;

      const { error: aptErr } = await client.from('appointments').select('id').limit(1);
      if (!aptErr) tables.appointments = true;

      const { error: taskErr } = await client.from('tasks').select('id').limit(1);
      if (!taskErr) tables.tasks = true;

      const hasAnyTable = tables.clinic_sync || tables.patients || tables.appointments || tables.tasks;

      return res.json({
        connected: true,
        url,
        tablesAvailable: tables,
        hasAnyTable,
        error: lastError,
        hint: !hasAnyTable ? 'Conexão ativa com o Supabase! Crie as tabelas no SQL Editor para iniciar a sincronização.' : undefined
      });
    } catch (err: any) {
      return res.status(500).json({
        connected: false,
        error: err.message || 'Erro ao conectar com o Supabase'
      });
    }
  });

  app.post('/api/supabase/sync', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      if (!client) {
        return res.status(400).json({ error: 'Supabase não inicializado no servidor.' });
      }

      const payload = req.body && Object.keys(req.body).length > 0 ? req.body : globalSyncState;
      let syncedCount = 0;

      // 1. Central clinic_sync
      const { error: syncErr } = await client
        .from('clinic_sync')
        .upsert({
          id: 'main_clinic',
          payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (!syncErr) syncedCount++;

      // 2. Patients table if exists
      if (Array.isArray(payload.patients) && payload.patients.length > 0) {
        const patientRows = payload.patients.map((p: any) => ({
          id: p.id,
          name: p.name || 'Paciente',
          cpf: p.cpf || '',
          record_number: p.recordNumber || '',
          discipline: p.discipline || 'Clínica Geral',
          data: p,
          updated_at: p.updatedAt || new Date().toISOString()
        }));

        const { error: patErr } = await client.from('patients').upsert(patientRows, { onConflict: 'id' });
        if (!patErr) syncedCount++;
      }

      // 3. Appointments table if exists
      if (Array.isArray(payload.appointments) && payload.appointments.length > 0) {
        const aptRows = payload.appointments.map((a: any) => ({
          id: a.id,
          patient_id: a.patientId,
          patient_name: a.patientName,
          date: a.date,
          start_time: a.startTime,
          end_time: a.endTime,
          discipline: a.discipline,
          status: a.status,
          data: a,
          updated_at: new Date().toISOString()
        }));

        const { error: aptErr } = await client.from('appointments').upsert(aptRows, { onConflict: 'id' });
        if (!aptErr) syncedCount++;
      }

      return res.json({
        success: syncedCount > 0,
        syncedTablesCount: syncedCount,
        message: syncedCount > 0 
          ? 'Dados sincronizados com o Supabase com sucesso!' 
          : 'As tabelas ainda não existem no banco Supabase. Execute o script SQL no painel.'
      });
    } catch (err: any) {
      console.error('[Supabase Server Sync Error]:', err);
      return res.status(500).json({ error: err.message || 'Erro ao sincronizar com Supabase' });
    }
  });

  app.get('/api/supabase/pull', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      if (!client) {
        return res.status(400).json({ error: 'Supabase não inicializado no servidor.' });
      }

      // Read from clinic_sync first
      const { data: syncRow, error: syncErr } = await client
        .from('clinic_sync')
        .select('payload')
        .eq('id', 'main_clinic')
        .maybeSingle();

      if (!syncErr && syncRow?.payload) {
        return res.json({ success: true, data: syncRow.payload, source: 'clinic_sync' });
      }

      // Fallback: read patients
      const { data: patRows, error: patErr } = await client
        .from('patients')
        .select('data');

      if (!patErr && patRows && patRows.length > 0) {
        const patients = patRows.map((r: any) => r.data);
        return res.json({ success: true, data: { patients }, source: 'patients' });
      }

      return res.json({ success: false, message: 'Nenhum dado encontrado no Supabase' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Granular secure delete endpoints
  app.delete('/api/supabase/patients/:id', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      if (!client) return res.status(400).json({ error: 'Supabase não inicializado' });
      const { id } = req.params;
      if (!id || id.length < 2) return res.status(400).json({ error: 'ID inválido' });
      const { error } = await client.from('patients').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/supabase/appointments/:id', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      if (!client) return res.status(400).json({ error: 'Supabase não inicializado' });
      const { id } = req.params;
      if (!id || id.length < 2) return res.status(400).json({ error: 'ID inválido' });
      const { error } = await client.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/supabase/tasks/:id', async (req, res) => {
    try {
      const client = getServerSupabaseClient();
      if (!client) return res.status(400).json({ error: 'Supabase não inicializado' });
      const { id } = req.params;
      if (!id || id.length < 2) return res.status(400).json({ error: 'ID inválido' });
      const { error } = await client.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dental Clinic Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
