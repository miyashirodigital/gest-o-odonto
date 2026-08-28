import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment } from '../types';
import { exportAcademicReportPDF } from '../utils/pdfGenerator';
import { WhatsAppModal } from './WhatsAppModal';
import { AppointmentModal } from './AppointmentModal';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckSquare, 
  ShieldAlert, 
  Download, 
  Bell, 
  CloudCheck, 
  MessageSquare, 
  Sparkles, 
  ChevronRight,
  Trash2,
  BookOpen,
  UserX,
  Stethoscope,
  Plus,
  X
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    patients, 
    appointments, 
    tasks, 
    disciplines, 
    notices, 
    isOnline, 
    syncStatus, 
    triggerDriveSync,
    setCurrentTab, 
    setSelectedPatientId, 
    deleteAppointment,
    addAcademicNotice,
    deleteAcademicNotice,
    duplaPartner,
    showToast 
  } = useApp();

  const [selectedWhatsAppApt, setSelectedWhatsAppApt] = useState<Appointment | null>(null);
  const [showNewAptModal, setShowNewAptModal] = useState<boolean>(false);
  const [showNewNoticeModal, setShowNewNoticeModal] = useState<boolean>(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState<string>('');
  const [newNoticeDescription, setNewNoticeDescription] = useState<string>('');
  const [newNoticeDate, setNewNoticeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newNoticeType, setNewNoticeType] = useState<'Entrega de Ficha' | 'Prova Prática' | 'Atendimento Clínico' | 'Seminário'>('Prova Prática');
  const [newNoticeDiscipline, setNewNoticeDiscipline] = useState<any>('Dentística Restauradora');

  // Metrics
  const totalPatients = patients.length;
  const patientsWithAllergies = patients.filter(p => p.anamnese.allergies && p.anamnese.allergies.length > 0).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  // Today / upcoming appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments
    .filter(a => a.date >= todayStr && a.status !== 'Concluído' && a.status !== 'Desmarcado')
    .slice(0, 6);

  const handleExportAcademicReport = () => {
    exportAcademicReportPDF(disciplines, patients, 'Rafael Mendes de Oliveira', '8º Período - Odontologia');
    showToast('Relatório Acadêmico Geral exportado em PDF com sucesso!');
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentTab('patients');
  };

  const handleRemoveAppointment = (apt: Appointment) => {
    deleteAppointment(apt.id);
    showToast(`Atendimento de ${apt.patientName} removido da agenda.`, 'info');
  };

  const activePatientForWhatsApp = selectedWhatsAppApt
    ? patients.find(p => p.id === selectedWhatsAppApt.patientId) || {
        id: selectedWhatsAppApt.patientId,
        name: selectedWhatsAppApt.patientName,
        phone: selectedWhatsAppApt.patientPhone,
        discipline: selectedWhatsAppApt.discipline
      }
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Academic Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-600/30">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-emerald-50 backdrop-blur-xs tracking-wider uppercase">
                UEL • Clínica Integrada Universitária 2026
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isOnline ? 'Prontuário Online & Offline Ativo' : 'Armazenamento Local Ativo'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Painel Acadêmico & Gestão Clínica
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-xl">
              Agendamento de cadeiras clínicas, prontuário digital com odontograma e assistente acadêmico com literatura odontológica completa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentTab('ai-assistant')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" /> Odonto IA (Literatura & Casos)
            </button>
            <button
              type="button"
              onClick={handleExportAcademicReport}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Relatório PDF
            </button>
            <button
              type="button"
              onClick={() => triggerDriveSync()}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 border border-emerald-500/30 text-emerald-100 text-xs font-semibold flex items-center gap-2"
            >
              <CloudCheck className="w-4 h-4 text-emerald-300" />
              {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => setCurrentTab('patients')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-4 md:p-5 shadow-xs hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pacientes Ativos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalPatients}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              Com prontuário e TCLE
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setCurrentTab('calendar')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-4 md:p-5 shadow-xs hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Atendimentos Agendados</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {appointments.length}
            </span>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
              {upcomingAppointments.length} próximos
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setCurrentTab('tasks')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-4 md:p-5 shadow-xs hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Checklist da Dupla</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
              {pendingTasksCount}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
              Tarefas a executar
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setCurrentTab('patients')}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-4 md:p-5 shadow-xs hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Alertas de Alergia</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400">
              {patientsWithAllergies}
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block mt-0.5">
              Atenção em anestésicos
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Next Appointments & AI Tutor Quick Banner, Right Notifications & Dupla Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments Card with Patient Removal Option */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100/60 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Próximos Atendimentos na Clínica ({upcomingAppointments.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lembretes WhatsApp e gerenciamento de pacientes na cadeira
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAptModal(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                + Novo Horário
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum atendimento agendado para os próximos dias. Clique em "+ Novo Horário" para agendar.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl border border-emerald-100/70 dark:border-slate-800 bg-[#F3F7F5]/50 dark:bg-slate-800/40 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          {apt.discipline}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {apt.startTime} às {apt.endTime}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({apt.boxNumber})</span>
                      </div>

                      <h4
                        onClick={() => handleViewPatient(apt.patientId)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 cursor-pointer"
                      >
                        {apt.patientName}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {apt.procedure}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWhatsAppApt(apt)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </button>

                      {/* Remove patient from upcoming appointment button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAppointment(apt)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remover paciente dos próximos atendimentos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Dental Mentor Quick Consult Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-md border border-emerald-700/40 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    Inteligência Acadêmica
                  </span>
                  <span className="text-[11px] text-slate-300">Baseada em Tratados e Livros Clássicos</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Assistente Odonto IA & Mentor de Casos Clínicos
                </h3>
                <p className="text-xs text-emerald-100/80 max-w-lg leading-relaxed">
                  Tire dúvidas em tempo real sobre condutas em Dentística (Baratieri), Endodontia (Cohen/Leonardo), Periodontia (Lindhe/Carranza), Cirurgia (Hupp/Peterson), Farmacologia e Anestesiologia (Malamed/Andrade).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentTab('ai-assistant')}
                className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 shrink-0"
              >
                <BookOpen className="w-4 h-4 text-slate-950" /> Consultar Mentor IA
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on lg): Academic Notices & Dupla Chat Widget */}
        <div className="space-y-6">
          {/* Academic Notices Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Avisos Acadêmicos & Prazos
              </h3>
              <button
                type="button"
                onClick={() => setShowNewNoticeModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition-colors"
                title="Adicionar novo aviso, prova ou prazo"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {notices.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum aviso cadastrado. Clique em "+ Adicionar" para criar um prazo de prova ou trabalho.
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-3.5 rounded-2xl border border-emerald-100/80 dark:border-slate-800 bg-[#F3F7F5]/50 dark:bg-slate-800/30 text-xs space-y-1.5 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {notice.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {new Date(notice.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteAcademicNotice(notice.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                          title="Excluir aviso"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {notice.description}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {notice.discipline}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {notice.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dupla Quick Chat Card Widget */}
          <div
            onClick={() => setCurrentTab('chat')}
            className="bg-[#111827] rounded-3xl p-6 shadow-xl text-white space-y-4 cursor-pointer hover:border-emerald-500/40 border border-slate-800 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-900 font-bold flex items-center justify-center text-sm shadow-md">
                  {duplaPartner.avatar || 'DP'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{duplaPartner.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-medium">Clínica Universitária • Box Clínico</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 text-xs border border-slate-700/60 text-slate-200">
              <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">Comunicação direta:</span>
              "Tudo pronto no Box! Vamos iniciar o atendimento."
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dupla Conectada
              </span>
              <span className="text-emerald-400 font-bold hover:underline">
                Abrir Chat →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedWhatsAppApt && activePatientForWhatsApp && (
        <WhatsAppModal
          patient={activePatientForWhatsApp as any}
          appointment={selectedWhatsAppApt}
          onClose={() => setSelectedWhatsAppApt(null)}
        />
      )}

      {showNewAptModal && (
        <AppointmentModal
          onClose={() => setShowNewAptModal(false)}
        />
      )}

      {/* New Academic Notice / Exam Modal */}
      {showNewNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Novo Aviso ou Prazo</h3>
                  <p className="text-[11px] text-slate-500">Adicione provas, entregas e datas acadêmicas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewNoticeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newNoticeTitle.trim()) return;
                addAcademicNotice({
                  title: newNoticeTitle.trim(),
                  description: newNoticeDescription.trim() || 'Sem observações adicionais.',
                  date: newNoticeDate,
                  type: newNoticeType,
                  discipline: newNoticeDiscipline
                });
                setNewNoticeTitle('');
                setNewNoticeDescription('');
                setShowNewNoticeModal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Aviso / Prazo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prova Prática de Endodontia, Entrega de Ficha..."
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={newNoticeType}
                    onChange={(e) => setNewNoticeType(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                    <option value="Prova Prática">Prova Prática</option>
                    <option value="Entrega de Ficha">Entrega de Ficha / Trabalho</option>
                    <option value="Atendimento Clínico">Atendimento Clínico</option>
                    <option value="Seminário">Seminário / Apresentação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Prazo *
                  </label>
                  <input
                    type="date"
                    required
                    value={newNoticeDate}
                    onChange={(e) => setNewNoticeDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Disciplina Associada
                </label>
                <select
                  value={newNoticeDiscipline}
                  onChange={(e) => setNewNoticeDiscipline(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="Dentística Restauradora">Dentística Restauradora</option>
                  <option value="Endodontia">Endodontia</option>
                  <option value="Periodontia">Periodontia</option>
                  <option value="Cirurgia Bucomaxilofacial">Cirurgia Bucomaxilofacial</option>
                  <option value="Prótese Dentária">Prótese Dentária</option>
                  <option value="Odontopediatria">Odontopediatria</option>
                  <option value="Estomatologia & Patologia">Estomatologia & Patologia</option>
                  <option value="Ortodontia">Ortodontia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição / Conteúdo Programático
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levar manequim e resinas compostas. Estudar capítulos de Baratieri..."
                  value={newNoticeDescription}
                  onChange={(e) => setNewNoticeDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewNoticeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  Salvar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
