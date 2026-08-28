import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { 
  Send, 
  Sparkles, 
  Tag, 
  Trash2, 
  Mic, 
  Play, 
  Square,
  X,
  Volume2,
  CheckCheck,
  UserCheck
} from 'lucide-react';

const QUICK_CLINICAL_PROMPTS = [
  'Paciente já chegou e está aguardando na recepção!',
  'Materiais e instrumentais estéreis já estão montados no Box.',
  'Pode chamar o professor para conferir o preparo cavitário?',
  'Precisamos pegar mais 1 tubete de Articaína 4% na central.',
  'Finalizei o isolamento absoluto no dente 16, vamos iniciar.',
  'Prontuário e radiografias já estão anexados no app.'
];

export const DuplaChatView: React.FC = () => {
  const { 
    chatMessages, 
    sendChatMessage, 
    sendVoiceMessage, 
    deleteChatMessage, 
    clearChatMessages, 
    patients, 
    currentStudent, 
    duplaPartner, 
    showToast 
  } = useApp();

  const [messageText, setMessageText] = useState<string>('');
  const [selectedPatientTag, setSelectedPatientTag] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (isRecording) {
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    sendChatMessage(messageText, selectedPatientTag || undefined);
    setMessageText('');
    setSelectedPatientTag('');

    // Simulated reply from partner after 1.5s
    setTimeout(() => {
      const sampleReplies = [
        'Perfeito! Já estou indo para o box ajudar você.',
        'Combinado! Já chamei o professor para assinar a ficha.',
        'Ótimo, já separei as resinas de esmalte e dentina.',
        'Ok! Já avisei a recepção da clínica.',
        'Beleza! Estou terminando a esterilização e já levo o material.'
      ];
      const randomReply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
      sendChatMessage(randomReply, undefined, duplaPartner.name);
    }, 1500);
  };

  const handleStartVoice = () => {
    setIsRecording(true);
  };

  const handleStopVoice = () => {
    const finalSecs = Math.max(recordingSeconds, 2);
    setIsRecording(false);
    sendVoiceMessage(finalSecs);
  };

  const handleCancelVoice = () => {
    setIsRecording(false);
    showToast('Gravação cancelada.', 'info');
  };

  const handlePlayAudio = (msgId: string) => {
    setPlayingAudioId(msgId);
    setTimeout(() => {
      setPlayingAudioId(null);
    }, 3000);
  };

  return (
    <div className="h-[calc(100vh-12rem)] min-h-[520px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-150">
      {/* Chat Top Header */}
      <div className="px-5 py-3.5 border-b border-emerald-100/60 dark:border-slate-800 flex items-center justify-between bg-[#F3F7F5]/40 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center shadow-xs text-sm">
              {duplaPartner.avatar || 'DP'}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {duplaPartner.name}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                Sua Dupla de Clínica
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {duplaPartner.semester} • Ativo no Box Clínico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-semibold text-slate-400 block">Sincronização em Tempo Real</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Dupla Online
            </span>
          </div>

          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm ? true : true) {
                  clearChatMessages();
                }
              }}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1 transition-colors"
              title="Limpar histórico de mensagens"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] font-semibold">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-b border-emerald-100/60 dark:border-slate-800 bg-[#F3F7F5]/30 dark:bg-slate-800/20 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" /> Ações Rápidas:
        </span>
        {QUICK_CLINICAL_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMessageText(prompt)}
            className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#F3F7F5]/20 dark:bg-slate-950/20">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <UserCheck className="w-12 h-12 text-emerald-500/40 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Canal Direto da Dupla de Clínica
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Envie recados rápidos, marque prontuários de pacientes ou grave áudios com recados para seu parceiro de cadeira clínica.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = 
              msg.sender === currentStudent.name || 
              msg.sender === 'Rafael (Você)' || 
              msg.senderRole === 'Estudante A';

            const messageBody = msg.content || msg.text || '';
            const attachedPatient = msg.attachedPatientName || msg.patientTag;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {isMe ? `${currentStudent.name.split(' ')[0]} (Você)` : msg.sender}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {msg.timestamp}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteChatMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition-opacity"
                    title="Excluir mensagem"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div
                  className={`max-w-md md:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-emerald-100/80 dark:border-slate-700 rounded-bl-xs'
                  }`}
                >
                  {/* Attached Patient Tag if any */}
                  {attachedPatient && (
                    <div
                      className={`mb-2 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        isMe ? 'bg-emerald-700/80 text-emerald-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-emerald-300" /> Paciente: <strong>{attachedPatient}</strong>
                    </div>
                  )}

                  {/* Audio Message Player simulation */}
                  {msg.audioDuration ? (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(msg.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isMe ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <Volume2 className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div>
                        <p className="font-bold text-xs">Mensagem de Voz</p>
                        <p className={`text-[10px] ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                          Duração: {msg.audioDuration}
                        </p>
                      </div>
                    </div>
                  ) : msg.isImage && msg.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={msg.imageUrl} 
                        alt="Anexo de clínica" 
                        className="rounded-xl max-h-56 object-cover w-full border border-black/10"
                        referrerPolicy="no-referrer"
                      />
                      {messageBody && <p className="whitespace-pre-wrap">{messageBody}</p>}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-normal">{messageBody}</p>
                  )}

                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                    <CheckCheck className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="p-3 sm:p-4 border-t border-emerald-100/60 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        {/* Patient Tag Selector Badge */}
        {selectedPatientTag && (
          <div className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" /> Marcando Paciente: <strong>{selectedPatientTag}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedPatientTag('')}
              className="text-xs font-bold hover:underline text-emerald-700 dark:text-emerald-300"
            >
              Remover tag
            </button>
          </div>
        )}

        {/* Audio Recording State */}
        {isRecording ? (
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl p-3 text-rose-700 dark:text-rose-300 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-600 rounded-full animate-ping" />
              <span className="text-xs font-bold">Gravando áudio para a dupla: 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelVoice}
                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 text-xs font-bold flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleStopVoice}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Square className="w-3.5 h-3.5" /> Enviar Áudio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Quick link to tag patient */}
            <select
              value={selectedPatientTag}
              onChange={(e) => setSelectedPatientTag(e.target.value)}
              className="text-xs px-2.5 py-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hidden md:block max-w-[170px] truncate"
            >
              <option value="">+ Tag de Paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Digite sua mensagem para a sua dupla..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="button"
              onClick={handleStartVoice}
              className="p-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
              title="Gravar áudio"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200/50 dark:shadow-none transition-transform active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
