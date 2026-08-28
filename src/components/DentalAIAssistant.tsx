import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Library, 
  GraduationCap, 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Search, 
  Stethoscope, 
  FileText, 
  HelpCircle,
  Pill,
  Syringe,
  Scissors,
  Layers,
  ChevronDown,
  Trash2,
  Share2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  specialty?: string;
  patientName?: string;
}

const SPECIALTIES = [
  { id: 'Todas', label: 'Todas as Áreas', icon: Library },
  { id: 'Dentística Restauradora', label: 'Dentística & Estética', icon: Layers },
  { id: 'Endodontia', label: 'Endodontia', icon: Sparkles },
  { id: 'Cirurgia Bucomaxilofacial', label: 'Cirurgia & Traumatologia', icon: Scissors },
  { id: 'Periodontia', label: 'Periodontia', icon: Stethoscope },
  { id: 'Farmacologia & Terapêutica', label: 'Farmacologia & Anestesia', icon: Pill },
  { id: 'Prótese Dentária & Oclusão', label: 'Prótese & Oclusão', icon: BookOpen },
  { id: 'Odontopediatria', label: 'Odontopediatria', icon: GraduationCap },
  { id: 'Radiologia & Imaginologia', label: 'Radiologia & Diagnóstico', icon: Search },
  { id: 'Patologia & Estomatologia', label: 'Estomatologia & Patologia', icon: AlertCircle },
];

const SUGGESTED_QUESTIONS = [
  {
    category: 'Conversa',
    label: 'Olá! Tudo bem? Como você pode me ajudar?',
    prompt: 'Olá! Tudo bem? Me conte um pouco sobre como você pode me ajudar na clínica e nos meus estudos de Odontologia.'
  },
  {
    category: 'Anestesiologia',
    label: 'Cálculo de dose máxima de Lidocaína 2% com Epi',
    prompt: 'Como calcular a dose máxima recomendada de Lidocaína 2% com Epinefrina 1:100.000 (Malamed) para um paciente de 65 kg? Quantos tubetes de 1,8ml correspondem a essa dose?'
  },
  {
    category: 'Dentística',
    label: 'Protocolo de adesão em esmalte e dentina úmida',
    prompt: 'Qual é o protocolo passo a passo de adesão em esmalte vs dentina para adesivos convencionais de 2 passos (sistema etch-and-rinse) e universais, baseado em Baratieri e Reis & Loguercio?'
  },
  {
    category: 'Cirurgia',
    label: 'Manejo pré e pós-operatório de Terceiros Molares inclusos',
    prompt: 'Quais as classificações de Pell & Gregory e Winter para terceiros molares inclusos e qual o protocolo farmacológico pré e pós-operatório preconizado por Hupp & Andrade?'
  },
  {
    category: 'Endodontia',
    label: 'Conduta em Necrose Pulpar com Periodontite Apical',
    prompt: 'Qual a sequência operatória completa para tratamento de canal de dente com necrose pulpar e periodontite apical aguda (Cohen & Hargreaves / Lopes & Siqueira)? Inclua substâncias químicas auxiliares e medicação intracanal recomendada.'
  },
  {
    category: 'Farmacologia',
    label: 'Profilaxia antibiótica para Endocardite Infecciosa',
    prompt: 'Qual é a diretriz atual da American Heart Association (AHA) e CFO para profilaxia antibiótica contra endocardite infecciosa em procedimentos odontológicos cruentos? Qual a dosagem de primeira escolha e para alérgicos a penicilinas?'
  }
];

export const DentalAIAssistant: React.FC = () => {
  const { patients, showToast } = useApp();

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('dento_ai_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Olá! Eu sou o OdontoMentor IA.**\n\nEstou aqui para conversar, tirar dúvidas e auxiliar você nos seus atendimentos clínicos e estudos de Odontologia (*Baratieri, Malamed, Cohen, Lindhe, Hupp, Neville e consensos atuais*).\n\n💬 **Como posso te ajudar hoje?** Pode me mandar um *"Oi, tudo bem?"*, tirar dúvidas de dosagens, discutir o prontuário de algum paciente ou pedir protocolos cirúrgicos e restauradores!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('Todas');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('dento_ai_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText || isLoading) return;

    // Build patient context if selected
    let patientContextData: any = null;
    let patientObj: any = null;

    if (selectedPatientId !== 'none') {
      patientObj = patients.find(p => p.id === selectedPatientId);
      if (patientObj) {
        patientContextData = {
          name: patientObj.name,
          age: patientObj.birthDate ? `${new Date().getFullYear() - new Date(patientObj.birthDate).getFullYear()} anos` : 'Desconhecido',
          discipline: patientObj.discipline,
          anamnese: {
            alergias: patientObj.anamnesis?.allergies || patientObj.allergies || 'Nenhuma informada',
            medicacoesEmUso: patientObj.anamnesis?.medicationsInUse || 'Nenhuma',
            condicoesSistemicas: patientObj.anamnesis?.systemicDiseases || 'Nenhuma',
            pressaoArterial: patientObj.anamnesis?.bloodPressure || 'Normal',
            gestanteLactante: patientObj.anamnesis?.pregnantOrLactating ? 'Sim' : 'Não'
          },
          evolutionsSummary: patientObj.evolutions?.map((e: any) => `${e.date} (${e.discipline}): ${e.procedureDone}`).join('; ') || 'Nenhum'
        };
      }
    }

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      specialty: selectedSpecialty !== 'Todas' ? selectedSpecialty : undefined,
      patientName: patientObj?.name
    };

    const assistantMsgId = 'msg-ai-' + (Date.now() + 1);
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build conversation history payload
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Try streaming endpoint for instant typewriter response
      const streamRes = await fetch('/api/gemini/dental-tutor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          specialty: selectedSpecialty !== 'Todas' ? selectedSpecialty : undefined,
          patientContext: patientContextData,
          conversationHistory: historyPayload
        })
      });

      if (streamRes.ok && streamRes.body) {
        // Add placeholder assistant message
        setMessages(prev => [...prev, initialAssistantMsg]);

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                const currentText = accumulated;
                setMessages(prev =>
                  prev.map(m => (m.id === assistantMsgId ? { ...m, content: currentText } : m))
                );
              } else if (parsed.error) {
                accumulated += `\n\n⚠️ ${parsed.error}`;
                setMessages(prev =>
                  prev.map(m => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
                );
              }
            } catch {
              // Ignore line parse errors
            }
          }
        }

        if (!accumulated.trim()) {
          // If stream ended empty, fallback to non-streaming
          throw new Error('Resposta vazia');
        }
      } else {
        // Fallback to standard request
        const res = await fetch('/api/gemini/dental-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            specialty: selectedSpecialty !== 'Todas' ? selectedSpecialty : undefined,
            patientContext: patientContextData,
            conversationHistory: historyPayload
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ${res.status} ao consultar IA`);
        }

        const data = await res.json();
        const aiResponseText = data.response || 'Não foi possível obter resposta.';

        const assistantMessage: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      console.error('Error fetching dental AI response:', err);
      const errorMessage: Message = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Ops!** Tivemos uma instabilidade momentânea: ${err.message || 'Tente novamente em instantes.'}\n\n*Dica: Pode tentar enviar novamente sua pergunta!*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const withoutEmpty = prev.filter(m => m.id !== assistantMsgId || m.content.trim() !== '');
        return [...withoutEmpty, errorMessage];
      });
      showToast('Erro ao obter resposta da IA', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Deseja limpar o histórico desta sessão com o OdontoMentor IA?')) {
      const initial: Message = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `👋 Histórico reiniciado! Faça uma nova pergunta sobre odontologia ou selecione um caso clínico.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initial]);
      localStorage.removeItem('dento_ai_history');
      showToast('Histórico de conversa reiniciado.');
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    showToast('Resposta copiada para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Leitura de voz não suportada pelo navegador.', 'warning');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner voice
    const cleanText = text.replace(/[*#_`~>[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-emerald-100/80 dark:border-slate-800 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200/50 dark:shadow-none">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-tight">
                OdontoMentor IA
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-600 text-white tracking-wide">
                Biblioteca & Casos
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conhecimento integrado dos livros-texto, diretrizes e literatura odontológica mundial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Patient Context Link Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden max-w-[150px] sm:max-w-[200px] truncate"
              title="Vincular dados de prontuário do paciente à consulta"
            >
              <option value="none">Nenhum paciente vinculado</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  👤 {p.name} ({p.discipline})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors"
            title="Limpar histórico da conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Specialty Filter Pills */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
          Área:
        </span>
        {SPECIALTIES.map((spec) => {
          const isSelected = selectedSpecialty === spec.id;
          const Icon = spec.icon;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{spec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Stage */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8FAF9] dark:bg-[#0f171e]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[82%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'bg-emerald-600 text-white shadow-emerald-200/50'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`p-4 rounded-3xl space-y-2 border text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {/* Meta tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-black/10 dark:border-white/10 text-[11px] font-medium opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {isUser ? 'Você (Acadêmico)' : 'OdontoMentor IA'}
                    </span>
                    {msg.specialty && (
                      <span className="px-1.5 py-0.2 rounded-md bg-white/20 dark:bg-slate-700 text-[10px]">
                        {msg.specialty}
                      </span>
                    )}
                    {msg.patientName && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-700 text-white text-[10px]">
                        Paciente: {msg.patientName}
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content */}
                <div className={`prose prose-xs sm:prose-sm max-w-none break-words ${isUser ? 'text-white' : 'dark:prose-invert text-slate-800 dark:text-slate-100'}`}>
                  <div className="markdown-body">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {/* Assistant Message Actions */}
                {!isUser && (
                  <div className="pt-2 flex items-center justify-end gap-1 text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(msg.id, msg.content)}
                      className={`p-1.5 rounded-lg hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                        speakingId === msg.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : ''
                      }`}
                      title={speakingId === msg.id ? 'Parar leitura de voz' : 'Ouvir resposta em áudio'}
                    >
                      {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1.5 rounded-lg hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Copiar texto da resposta"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Consultando acervo de livros e diretrizes de Odontologia...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Inquiries (Shown when conversation is short) */}
      {messages.length <= 2 && (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-emerald-100/60 dark:border-slate-800 shrink-0">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Dúvidas Frequentes & Protocolos Clínicos Rápidos:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTED_QUESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(sug.prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 text-left text-xs text-slate-700 dark:text-slate-200 shrink-0 max-w-[280px] transition-all"
              >
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase">
                  {sug.category}
                </span>
                <span className="line-clamp-1 font-medium">{sug.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-emerald-100 dark:border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça qualquer pergunta clínica, conduta, dosagem farmacológica, técnica ou caso clínico..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            {selectedPatientId !== 'none' && (
              <span className="absolute right-3 bottom-2.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Contexto Ativo: {patients.find(p => p.id === selectedPatientId)?.name.split(' ')[0]}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold shadow-md shadow-emerald-200/50 dark:shadow-none transition-transform active:scale-95 shrink-0"
            title="Enviar pergunta (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          OdontoMentor IA utiliza modelos de inteligência artificial com base na literatura odontológica. Em casos clínicos reais, sempre valide a conduta com o docente responsável.
        </p>
      </div>
    </div>
  );
};
