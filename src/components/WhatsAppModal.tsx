import React, { useState } from 'react';
import { Patient, Appointment } from '../types';
import { WHATSAPP_TEMPLATES, generateWhatsAppUrl } from '../utils/whatsappTemplates';
import { X, Send, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface WhatsAppModalProps {
  patient: Patient;
  appointment?: Appointment;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ patient, appointment, onClose }) => {
  const { markAppointmentWhatsAppSent, showToast } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(WHATSAPP_TEMPLATES[0].id);
  const [studentName, setStudentName] = useState<string>('Rafael');
  const [copied, setCopied] = useState<boolean>(false);

  const activeTemplate = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
  const [customText, setCustomText] = useState<string>(() => activeTemplate.generateText(patient, appointment, studentName));

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = WHATSAPP_TEMPLATES.find(t => t.id === tmplId);
    if (tmpl) {
      setCustomText(tmpl.generateText(patient, appointment, studentName));
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      showToast('Texto copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Não foi possível copiar automaticamente.', 'warning');
    }
  };

  const handleSendWhatsApp = () => {
    if (appointment) {
      markAppointmentWhatsAppSent(appointment.id);
    }
    const url = generateWhatsAppUrl(patient.phone, customText);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`WhatsApp aberto para ${patient.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Lembrete Inteligente WhatsApp
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paciente: <strong className="text-slate-800 dark:text-slate-200">{patient.name}</strong> • Telefone: {patient.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Template Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Selecione o Modelo de Mensagem:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHATSAPP_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedTemplateId === tmpl.id
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{tmpl.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Student signature field */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Seu nome de acadêmico:</span>
            <input
              type="text"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                setCustomText(activeTemplate.generateText(patient, appointment, e.target.value));
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Message Preview & Customization Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Mensagem Gerada (Você pode editar antes de enviar):
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
            </div>
            <textarea
              rows={8}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-sans focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" /> Abrir WhatsApp Web / App
          </button>
        </div>
      </div>
    </div>
  );
};
