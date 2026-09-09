import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient, Appointment, TaskItem } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://ywsrmwslcyevvwuotwpu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_0aT9kjM33THbbFvpuz-j_g_sYacrfBO';

export function normalizeSupabaseUrl(url: string): string {
  if (!url) return DEFAULT_SUPABASE_URL;
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export const SUPABASE_STORAGE_KEY = 'odonto_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.anonKey) {
        return {
          url: normalizeSupabaseUrl(parsed.url),
          anonKey: parsed.anonKey.trim()
        };
      }
    }
  } catch (e) {
    console.warn('[Supabase] Erro ao ler config salva:', e);
  }

  // Use import.meta.env or default credentials provided by user
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  return {
    url: normalizeSupabaseUrl(envUrl || DEFAULT_SUPABASE_URL),
    anonKey: (envKey || DEFAULT_SUPABASE_ANON_KEY).trim()
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    const normalized = {
      url: normalizeSupabaseUrl(config.url),
      anonKey: config.anonKey.trim()
    };
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(normalized));
    supabaseClientInstance = null; // Reset cached instance
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar config:', e);
  }
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  try {
    const config = getSavedSupabaseConfig();
    if (!config.url || !config.anonKey) return null;

    supabaseClientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    return supabaseClientInstance;
  } catch (err) {
    console.error('[Supabase] Erro ao inicializar cliente:', err);
    return null;
  }
}

export interface SupabaseStatusResult {
  connected: boolean;
  url: string;
  tablesAvailable: {
    clinic_sync: boolean;
    patients: boolean;
    appointments: boolean;
    tasks: boolean;
  };
  hasAnyTable: boolean;
  error?: string;
  hint?: string;
}

export const SUPABASE_SETUP_SQL = `-- Script de Configuração do Banco de Dados OdontoClínica no Supabase
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Tabela central de Sincronização da Clínica (Estado Completo)
CREATE TABLE IF NOT EXISTS public.clinic_sync (
  id TEXT PRIMARY KEY DEFAULT 'main_clinic',
  payload JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela individual de Pacientes
CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT,
  record_number TEXT,
  discipline TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela individual de Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  discipline TEXT,
  status TEXT DEFAULT 'agendado',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela individual de Tarefas / Pendências
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.clinic_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Public access on clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "Allow public select clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "Allow public insert clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "Allow public update clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "secure_select_clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "secure_insert_clinic_sync" ON public.clinic_sync;
DROP POLICY IF EXISTS "secure_update_clinic_sync" ON public.clinic_sync;

DROP POLICY IF EXISTS "Public access on patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public select patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public update patients" ON public.patients;
DROP POLICY IF EXISTS "secure_select_patients" ON public.patients;
DROP POLICY IF EXISTS "secure_insert_patients" ON public.patients;
DROP POLICY IF EXISTS "secure_update_patients" ON public.patients;
DROP POLICY IF EXISTS "secure_delete_patients" ON public.patients;

DROP POLICY IF EXISTS "Public access on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update appointments" ON public.appointments;
DROP POLICY IF EXISTS "secure_select_appointments" ON public.appointments;
DROP POLICY IF EXISTS "secure_insert_appointments" ON public.appointments;
DROP POLICY IF EXISTS "secure_update_appointments" ON public.appointments;
DROP POLICY IF EXISTS "secure_delete_appointments" ON public.appointments;

DROP POLICY IF EXISTS "Public access on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public select tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update tasks" ON tasks;
DROP POLICY IF EXISTS "secure_select_tasks" ON public.tasks;
DROP POLICY IF EXISTS "secure_insert_tasks" ON public.tasks;
DROP POLICY IF EXISTS "secure_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "secure_delete_tasks" ON public.tasks;

-- 1. clinic_sync: Apenas id 'main_clinic', SEM permissão de DELETE (impossibilita apagar o snapshot central)
CREATE POLICY "secure_select_clinic_sync" ON public.clinic_sync 
  FOR SELECT USING (id = 'main_clinic');

CREATE POLICY "secure_insert_clinic_sync" ON public.clinic_sync 
  FOR INSERT WITH CHECK (id = 'main_clinic' AND payload IS NOT NULL);

CREATE POLICY "secure_update_clinic_sync" ON public.clinic_sync 
  FOR UPDATE USING (id = 'main_clinic') WITH CHECK (id = 'main_clinic' AND payload IS NOT NULL);

-- 2. patients: Valida IDs não-vazios e integridade de dados; permite delete seguro por ID
CREATE POLICY "secure_select_patients" ON public.patients 
  FOR SELECT USING (id IS NOT NULL AND length(id) >= 2);

CREATE POLICY "secure_insert_patients" ON public.patients 
  FOR INSERT WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_update_patients" ON public.patients 
  FOR UPDATE USING (id IS NOT NULL AND length(id) >= 2) 
  WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_delete_patients" ON public.patients 
  FOR DELETE USING (id IS NOT NULL AND length(id) >= 2);

-- 3. appointments: Validação de chave e deleção controlada
CREATE POLICY "secure_select_appointments" ON public.appointments 
  FOR SELECT USING (id IS NOT NULL AND length(id) >= 2);

CREATE POLICY "secure_insert_appointments" ON public.appointments 
  FOR INSERT WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_update_appointments" ON public.appointments 
  FOR UPDATE USING (id IS NOT NULL AND length(id) >= 2) 
  WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_delete_appointments" ON public.appointments 
  FOR DELETE USING (id IS NOT NULL AND length(id) >= 2);

-- 4. tasks: Validação de chave e deleção controlada
CREATE POLICY "secure_select_tasks" ON public.tasks 
  FOR SELECT USING (id IS NOT NULL AND length(id) >= 2);

CREATE POLICY "secure_insert_tasks" ON public.tasks 
  FOR INSERT WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_update_tasks" ON public.tasks 
  FOR UPDATE USING (id IS NOT NULL AND length(id) >= 2) 
  WITH CHECK (id IS NOT NULL AND length(id) >= 2 AND data IS NOT NULL);

CREATE POLICY "secure_delete_tasks" ON public.tasks 
  FOR DELETE USING (id IS NOT NULL AND length(id) >= 2);

-- Habilitar Realtime para as tabelas (Opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_sync, public.patients, public.appointments, public.tasks;
`;

export async function checkSupabaseStatus(): Promise<SupabaseStatusResult> {
  const client = getSupabaseClient();
  const config = getSavedSupabaseConfig();

  if (!client) {
    return {
      connected: false,
      url: config.url,
      tablesAvailable: { clinic_sync: false, patients: false, appointments: false, tasks: false },
      hasAnyTable: false,
      error: 'Cliente Supabase não inicializado.'
    };
  }

  const tables = {
    clinic_sync: false,
    patients: false,
    appointments: false,
    tasks: false
  };

  let lastError: string | undefined;

  try {
    // Check clinic_sync table
    const { error: syncErr } = await client.from('clinic_sync').select('id').limit(1);
    if (!syncErr) {
      tables.clinic_sync = true;
    } else if (syncErr.code !== 'PGRST205') {
      lastError = syncErr.message;
    }

    // Check patients table
    const { error: patErr } = await client.from('patients').select('id').limit(1);
    if (!patErr) {
      tables.patients = true;
    } else if (patErr.code !== 'PGRST205') {
      lastError = patErr.message;
    }

    // Check appointments table
    const { error: aptErr } = await client.from('appointments').select('id').limit(1);
    if (!aptErr) {
      tables.appointments = true;
    }

    // Check tasks table
    const { error: taskErr } = await client.from('tasks').select('id').limit(1);
    if (!taskErr) {
      tables.tasks = true;
    }

    const hasAnyTable = tables.clinic_sync || tables.patients || tables.appointments || tables.tasks;

    return {
      connected: true,
      url: config.url,
      tablesAvailable: tables,
      hasAnyTable,
      error: lastError,
      hint: !hasAnyTable ? 'Conexão válida com o Supabase! As tabelas ainda precisam ser criadas no SQL Editor.' : undefined
    };
  } catch (err: any) {
    return {
      connected: false,
      url: config.url,
      tablesAvailable: tables,
      hasAnyTable: false,
      error: err.message || 'Falha ao conectar com o Supabase.'
    };
  }
}

/**
 * Salva o estado completo no Supabase (tabela clinic_sync e tabelas individuais)
 */
export async function pushStateToSupabase(state: {
  patients?: Patient[];
  appointments?: Appointment[];
  tasks?: TaskItem[];
  [key: string]: any;
}): Promise<{ success: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase não configurado' };

  try {
    let syncedTables = 0;

    // 1. Tentar salvar no clinic_sync (tabela central de sincronização)
    const { error: syncError } = await client
      .from('clinic_sync')
      .upsert({
        id: 'main_clinic',
        payload: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (!syncError) {
      syncedTables++;
    }

    // 2. Sincronizar tabela patients se existir
    if (Array.isArray(state.patients) && state.patients.length > 0) {
      const patientRows = state.patients.map(p => ({
        id: p.id,
        name: p.name || 'Paciente',
        cpf: p.cpf || '',
        record_number: p.recordNumber || '',
        discipline: p.discipline || 'Clínica Integrada',
        data: p,
        updated_at: p.updatedAt || new Date().toISOString()
      }));

      const { error: patError } = await client
        .from('patients')
        .upsert(patientRows, { onConflict: 'id' });

      if (!patError) syncedTables++;
    }

    // 3. Sincronizar tabela appointments se existir
    if (Array.isArray(state.appointments) && state.appointments.length > 0) {
      const aptRows = state.appointments.map(a => ({
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

      const { error: aptError } = await client
        .from('appointments')
        .upsert(aptRows, { onConflict: 'id' });

      if (!aptError) syncedTables++;
    }

    // 4. Sincronizar tabela tasks se existir
    if (Array.isArray(state.tasks) && state.tasks.length > 0) {
      const taskRows = state.tasks.map(t => ({
        id: t.id,
        title: t.title,
        completed: Boolean(t.completed),
        data: t,
        updated_at: new Date().toISOString()
      }));

      const { error: taskError } = await client
        .from('tasks')
        .upsert(taskRows, { onConflict: 'id' });

      if (!taskError) syncedTables++;
    }

    if (syncedTables > 0) {
      return { success: true, message: `Dados sincronizados com sucesso no Supabase!` };
    }

    return { 
      success: false, 
      message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas. Execute o script SQL no painel.' 
    };
  } catch (err: any) {
    console.error('[Supabase] Erro ao sincronizar estado:', err);
    return { success: false, message: err.message || 'Erro ao sincronizar' };
  }
}

/**
 * Puxa dados do Supabase
 */
export async function pullStateFromSupabase(): Promise<{ success: boolean; data?: any; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase não inicializado' };

  try {
    // 1. Tentar ler do clinic_sync
    const { data: syncData, error: syncError } = await client
      .from('clinic_sync')
      .select('payload, updated_at')
      .eq('id', 'main_clinic')
      .maybeSingle();

    if (!syncError && syncData && syncData.payload) {
      return { success: true, data: syncData.payload };
    }

    // 2. Se clinic_sync não tiver dados, tentar ler de patients
    const { data: patData, error: patError } = await client
      .from('patients')
      .select('data');

    if (!patError && patData && patData.length > 0) {
      const patients = patData.map(d => d.data);
      return { success: true, data: { patients } };
    }

    return { success: false, message: 'Nenhum dado encontrado no Supabase ainda' };
  } catch (err: any) {
    console.error('[Supabase] Erro ao carregar dados:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Remove um paciente do Supabase de forma segura e imediata
 */
export async function deletePatientFromSupabase(id: string): Promise<boolean> {
  if (!id || id.trim().length < 2) return false;
  try {
    // 1. Tentar via servidor seguro
    const res = await fetch(`/api/supabase/patients/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    if (res && res.ok) return true;

    // 2. Fallback direto via SDK
    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client.from('patients').delete().eq('id', id);
    if (error) console.warn('[Supabase] Delete patient warning:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase] Delete patient catch:', e);
    return false;
  }
}

/**
 * Remove um agendamento do Supabase
 */
export async function deleteAppointmentFromSupabase(id: string): Promise<boolean> {
  if (!id || id.trim().length < 2) return false;
  try {
    const res = await fetch(`/api/supabase/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    if (res && res.ok) return true;

    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client.from('appointments').delete().eq('id', id);
    if (error) console.warn('[Supabase] Delete appointment warning:', error.message);
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Remove uma tarefa do Supabase
 */
export async function deleteTaskFromSupabase(id: string): Promise<boolean> {
  if (!id || id.trim().length < 2) return false;
  try {
    const res = await fetch(`/api/supabase/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    if (res && res.ok) return true;

    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client.from('tasks').delete().eq('id', id);
    if (error) console.warn('[Supabase] Delete task warning:', error.message);
    return !error;
  } catch (e) {
    return false;
  }
}
