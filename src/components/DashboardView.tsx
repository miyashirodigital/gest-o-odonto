import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, Patient } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { AppointmentModal } from './AppointmentModal';
import { getPatientActiveAllergies } from '../utils/storage';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckSquare, 
  ShieldAlert, 
  ShieldCheck,
  Bell, 
  MessageSquare, 
  Sparkles, 
  ChevronRight,
  Trash2,
  BookOpen,
  User,
  Stethoscope,
  Plus,
  X,
  ArrowRight,
  UserCheck,
  Layers,
  GraduationCap
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    patients, 
    appointments, 
    tasks, 
    disciplines, 
    notices, 
    studySubjects,
    isOnline, 
    syncStatus,
    triggerCloudSync,
    lastSyncedTime,
    setCurrentTab, 
    setSelectedPatientId, 
    deleteAppointment,
    addAcademicNotice,
    deleteAcademicNotice,
    duplaPartner,
    currentStudent,
    showToast 
  } = useApp();

  const [selectedWhatsAppApt, setSelectedWhatsAppApt] = useState<Appointment | null>(null);
  const [showNewAptModal, setShowNewAptModal] = useState<boolean>(false);
  const [preselectedPatientForApt, setPreselectedPatientForApt] = useState<Patient | null>(null);
  const [showMobileAppointmentsModal, setShowMobileAppointmentsModal] = useState<boolean>(false);
  const [showDynamicMetricModal, setShowDynamicMetricModal] = useState<'today' | 'in_progress' | 'waiting_return' | null>(null);
  const [showNewNoticeModal, setShowNewNoticeModal] = useState<boolean>(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState<string>('');
  const [newNoticeDescription, setNewNoticeDescription] = useState<string>('');
  const [newNoticeDate, setNewNoticeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newNoticeType, setNewNoticeType] = useState<'Entrega de Ficha' | 'Prova Prática' | 'Atendimento Clínico' | 'Seminário'>('Prova Prática');
  const [newNoticeDiscipline, setNewNoticeDiscipline] = useState<any>('Dentística Restauradora');

  // Real date formatted as YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Metrics calculation
  const totalPatients = patients.length;
  const patientsWithRealAllergies = patients.filter(p => getPatientActiveAllergies(p.anamnese?.allergies).length > 0).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  // Real appointments today
  const todayAppointments = appointments
    .filter(a => a.date === todayStr && a.status !== 'Desmarcado')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayAppointmentsCount = todayAppointments.length;

  // Upcoming appointments (today or future)
  const upcomingAppointments = appointments
    .filter(a => a.date >= todayStr && a.status !== 'Concluído' && a.status !== 'Desmarcado')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  // In-progress treatments (Patients with active upcoming appointments OR diagnosed teeth conditions needing treatment in their odontogram)
  const inProgressPatients = patients.filter(p => {
    const hasUpcoming = appointments.some(a => a.patientId === p.id && a.status !== 'Concluído' && a.status !== 'Desmarcado');
    const hasDiagnosedNeed = Object.values(p.odontogram || {}).some(t => {
      const g = t.generalCondition?.toLowerCase();
      if (g && !['higido', 'ausente', 'selante', 'restaurado'].includes(g)) return true;
      return t.conditions?.some(c => !['higido', 'ausente', 'selante', 'restaurado'].includes(c.condition?.toLowerCase()));
    });
    return hasUpcoming || hasDiagnosedNeed;
  });
  const inProgressCount = inProgressPatients.length;

  // Waiting return patients (Patients with clinical history / evolutions or diagnosed conditions, but NO upcoming appointment scheduled)
  const waitingReturnPatients = patients.filter(p => {
    const hasUpcoming = appointments.some(a => a.patientId === p.id && a.date >= todayStr && a.status !== 'Desmarcado');
    const hasClinicalHistory = p.evolutions && p.evolutions.length > 0;
    const hasPendingProcedures = Object.values(p.odontogram || {}).some(t => {
      const g = t.generalCondition?.toLowerCase();
      if (g && !['higido', 'ausente'].includes(g)) return true;
      return t.conditions?.some(c => !['higido', 'ausente'].includes(c.condition?.toLowerCase()));
    });
    return !hasUpcoming && (hasClinicalHistory || hasPendingProcedures);
  });
  const waitingReturnCount = waitingReturnPatients.length;

  // Determine next patient dynamically
  const nextAppointment = upcomingAppointments[0] || null;
  const nextPatient: Patient | null = nextAppointment 
    ? (patients.find(p => p.id === nextAppointment.patientId) || null)
    : null;

  const studentFirstName = currentStudent?.name?.split(' ')[0] || 'Rafael';

  const handleOpenPatient = (patientId: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    } else if (patients[0]) {
      setSelectedPatientId(patients[0].id);
    }
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
      {/* Visual Hero Banner with Fluid Moving Green Animation */}
      <div className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 animate-fluid-gradient">
        {/* Animated Fluid Blobs in Background */}
        <div className="absolute -top-12 -left-12 w-72 h-72 bg-emerald-400/30 rounded-full blur-3xl pointer-events-none animate-fluid-blob" />
        <div className="absolute top-1/2 -right-16 w-80 h-80 bg-teal-300/25 rounded-full blur-3xl pointer-events-none animate-fluid-blob-slow" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none animate-fluid-blob" />

        <div className="relative z-10 space-y-6">
          {/* Header Title & Greeting */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-emerald-100 backdrop-blur-xs border border-white/10 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              {currentStudent?.university || 'Odontologia UEL'} • Clínica Integrada
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              Olá, {studentFirstName} <span className="inline-block animate-bounce text-3xl">👋</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed">
              {todayAppointmentsCount > 0 
                ? `Você tem ${todayAppointmentsCount} ${todayAppointmentsCount === 1 ? 'atendimento programado' : 'atendimentos programados'} para hoje.`
                : 'Sua clínica de hoje está organizada e pronta para novos atendimentos.'}
            </p>
          </div>

          {/* 3 Visual Highlights (Fully dynamic & interactive) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setShowDynamicMetricModal('today')}
              className="text-left bg-black/20 hover:bg-black/35 active:scale-[0.99] backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 text-lg group-hover:scale-110 transition-transform">
                📅
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">
                  {todayAppointmentsCount} {todayAppointmentsCount === 1 ? 'paciente hoje' : 'pacientes hoje'}
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium flex items-center justify-between">
                  <span>Agenda do dia</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-300/70 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowDynamicMetricModal('in_progress')}
              className="text-left bg-black/20 hover:bg-black/35 active:scale-[0.99] backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-200 flex items-center justify-center font-bold shrink-0 text-lg group-hover:scale-110 transition-transform">
                🦷
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">
                  {inProgressCount} {inProgressCount === 1 ? 'tratamento ativo' : 'tratamentos em andamento'}
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium flex items-center justify-between">
                  <span>Procedimentos ativos</span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-200/70 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowDynamicMetricModal('waiting_return')}
              className="text-left bg-black/20 hover:bg-black/35 active:scale-[0.99] backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-200 flex items-center justify-center font-bold shrink-0 text-lg group-hover:scale-110 transition-transform">
                ⏰
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">
                  {waitingReturnCount} {waitingReturnCount === 1 ? 'paciente aguardando retorno' : 'pacientes aguardando retorno'}
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium flex items-center justify-between">
                  <span>Controle pós-operatório</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-200/70 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          </div>

          {/* Next Patient Visual Card - Dynamic */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-300" /> Próximo paciente
              </span>
              {nextAppointment ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950">
                  {nextAppointment.date === todayStr ? 'Hoje' : new Date(nextAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {nextAppointment.startTime}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-emerald-100">
                  Sem agendamento pendente
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-400/30 text-white flex items-center justify-center font-black text-sm shrink-0 border border-white/20">
                      {nextAppointment.patientName?.charAt(0) || '👤'}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                        {nextAppointment.patientName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-100/90 font-medium mt-0.5">
                        <span>🕒 {nextAppointment.startTime} às {nextAppointment.endTime}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-200 font-semibold">
                          🦷 {nextAppointment.procedure || nextAppointment.discipline}
                        </span>
                        {nextAppointment.boxNumber && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-300/90">{nextAppointment.boxNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {nextAppointment.patientPhone && (
                    <button
                      type="button"
                      onClick={() => setSelectedWhatsAppApt(nextAppointment)}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold text-xs border border-emerald-400/30 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenPatient(nextAppointment.patientId)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 group"
                  >
                    Abrir prontuário
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="text-sm font-bold text-white">Nenhum atendimento na fila no momento</h3>
                  <p className="text-xs text-emerald-100/80">Todos os atendimentos foram concluídos ou você ainda não agendou novos horários.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Agendar Atendimento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Metric Stats Cards (Pastel Colors: Verde, Amarelo, Azul, Vermelho) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1 - Pacientes Ativos (Verde Pastel) */}
        <div
          onClick={() => setCurrentTab('patients')}
          className="bg-[#D1FAE5]/85 hover:bg-[#A7F3D0]/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 p-4 md:p-5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">Pacientes Ativos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-300/80 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200 flex items-center justify-center shadow-2xs font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-emerald-950 dark:text-emerald-50">
              {totalPatients}
            </span>
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block mt-0.5">
              Prontuários e fichas
            </span>
          </div>
        </div>

        {/* Metric 2 - Atendimentos Agendados (Amarelo Pastel) */}
        <div
          onClick={() => setCurrentTab('calendar')}
          className="bg-[#FEF3C7]/85 hover:bg-[#FDE68A]/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 rounded-2xl border border-amber-300/80 dark:border-amber-800/80 p-4 md:p-5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-950 dark:text-amber-200">Atendimentos Agendados</span>
            <div className="w-9 h-9 rounded-xl bg-amber-300/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 flex items-center justify-center shadow-2xs font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-amber-950 dark:text-amber-50">
              {appointments.length}
            </span>
            <span className="text-xs text-amber-900 dark:text-amber-300 font-bold block mt-0.5">
              {upcomingAppointments.length} próximos horários
            </span>
          </div>
        </div>

        {/* Metric 3 - Checklist da Dupla (Azul Pastel) */}
        <div
          onClick={() => setCurrentTab('tasks')}
          className="bg-[#E0F2FE]/85 hover:bg-[#BAE6FD]/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 rounded-2xl border border-sky-300/80 dark:border-sky-800/80 p-4 md:p-5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-sky-950 dark:text-sky-200">Checklist da Dupla</span>
            <div className="w-9 h-9 rounded-xl bg-sky-300/80 text-sky-900 dark:bg-sky-900/80 dark:text-sky-200 flex items-center justify-center shadow-2xs font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-sky-950 dark:text-sky-50">
              {pendingTasksCount}
            </span>
            <span className="text-xs text-sky-800 dark:text-sky-300 font-bold block mt-0.5">
              Tarefas a executar
            </span>
          </div>
        </div>

        {/* Metric 4 - Alertas de Alergia (Vermelho Pastel) */}
        <div
          onClick={() => setCurrentTab('patients')}
          className="bg-[#FFE4E6]/85 hover:bg-[#FECDD3]/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 rounded-2xl border border-rose-300/80 dark:border-rose-800/80 p-4 md:p-5 shadow-xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-950 dark:text-rose-200">Alertas de Alergia</span>
            <div className="w-9 h-9 rounded-xl bg-rose-300/80 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200 flex items-center justify-center shadow-2xs font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-black text-rose-950 dark:text-rose-50">
              {patientsWithRealAllergies}
            </span>
            <span className="text-xs text-rose-800 dark:text-rose-300 font-bold block mt-0.5">
              Atenção com fármacos
            </span>
          </div>
        </div>
      </div>

      {/* Centered Presentation Section for Dental Students */}
      <div className="text-center py-2 px-3 sm:px-6 max-w-3xl mx-auto space-y-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
          Painel de Gestão Clínica para estudantes!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
          Organize agendamento de pacientes, prontuário digital com odontograma 2D, checklist de materiais e acompanhamento de metas curriculares.
        </p>
      </div>

      {/* Main Grid: Left Next Appointments, Right Notifications & Dupla Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments Card */}
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
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum atendimento agendado para os próximos dias.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((apt) => (
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
                        onClick={() => handleOpenPatient(apt.patientId)}
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

                      <button
                        type="button"
                        onClick={() => handleRemoveAppointment(apt)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remover atendimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access to Studies & Routines */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-md border border-emerald-700/40 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-emerald-300" />
                    Plano de Estudos & Provas
                  </span>
                  <span className="text-[11px] text-slate-300 truncate max-w-[200px]">
                    {currentStudent?.university || 'UEL • Odontologia'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Organize seus temas de estudo e cronograma de provas
                </h3>
                <p className="text-xs text-emerald-100/80 max-w-lg leading-relaxed">
                  Defina quais matérias e temas estudar, acompanhe datas de provas e acesse pastas do Google Drive e resumos do Google Docs.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentTab('studies')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-950" /> Abrir Estudos
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('tasks')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-300" /> Checklist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on lg): Academic Notices & Dupla Partner Card */}
        <div className="space-y-6">
          {/* Academic Notices Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-100/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Avisos & Prazos</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewNoticeModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition-colors"
                title="Adicionar novo aviso ou prazo"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {notices.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum aviso cadastrado. Clique em "+ Adicionar" para criar um prazo de prova ou trabalho.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-2.5 rounded-xl border border-emerald-100/80 dark:border-slate-800 bg-[#F3F7F5]/60 dark:bg-slate-800/40 text-xs flex flex-col justify-between transition-all hover:border-emerald-300"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 text-[11px] leading-tight" title={notice.title}>
                          {notice.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAcademicNotice(notice.id);
                          }}
                          className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-rose-600 active:text-rose-700 rounded transition-colors shrink-0"
                          title="Remover aviso"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500 sm:text-slate-400 sm:hover:text-rose-600" />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {new Date(notice.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>

                      {notice.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] line-clamp-2 leading-tight">
                          {notice.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 mt-1 border-t border-emerald-100/40 dark:border-slate-700/40">
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[75px]" title={notice.discipline}>
                        {notice.discipline}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                        {notice.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dupla Clinical Partner Info Card */}
          <div className="bg-[#111827] rounded-3xl p-6 shadow-xl text-white space-y-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-900 font-bold flex items-center justify-center text-sm shadow-md">
                  {duplaPartner.avatar || 'BR'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{duplaPartner.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-medium">Dupla de Clínica • {duplaPartner.semester}</p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Ativo" />
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 text-xs border border-slate-700/60 text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Telefone / Contato:</span>
                <span className="font-semibold text-white">{duplaPartner.phone || '(43) 99881-2233'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Status no Box:</span>
                <span className="text-emerald-400 font-bold">Box Clínico Pronto</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setCurrentTab('tasks')}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Checklist da Dupla
              </button>
              {duplaPartner.phone && (
                <a
                  href={`https://wa.me/55${duplaPartner.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  WhatsApp
                </a>
              )}
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
          initialPatientId={preselectedPatientForApt?.id}
          onClose={() => {
            setShowNewAptModal(false);
            setPreselectedPatientForApt(null);
          }}
        />
      )}

      {/* Dynamic Metric Detail Modal (Pacientes Hoje / Tratamentos Ativos / Aguardando Retorno) */}
      {showDynamicMetricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-emerald-100/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
                  {showDynamicMetricModal === 'today' && '📅'}
                  {showDynamicMetricModal === 'in_progress' && '🦷'}
                  {showDynamicMetricModal === 'waiting_return' && '⏰'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {showDynamicMetricModal === 'today' && 'Pacientes Agendados Para Hoje'}
                    {showDynamicMetricModal === 'in_progress' && 'Tratamentos em Andamento'}
                    {showDynamicMetricModal === 'waiting_return' && 'Pacientes Aguardando Retorno'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {showDynamicMetricModal === 'today' && `${todayAppointmentsCount} paciente(s) com horário marcado na clínica hoje`}
                    {showDynamicMetricModal === 'in_progress' && `${inProgressCount} paciente(s) com procedimentos ativos ou agendados`}
                    {showDynamicMetricModal === 'waiting_return' && `${waitingReturnCount} paciente(s) que precisam de agendamento de retorno / controle`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDynamicMetricModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {showDynamicMetricModal === 'today' && (
                todayAppointments.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                      📅
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhum paciente agendado para hoje.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDynamicMetricModal(null);
                        setShowNewAptModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                    >
                      + Agendar Horário Para Hoje
                    </button>
                  </div>
                ) : (
                  todayAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl border border-emerald-100 dark:border-slate-800 bg-[#F3F7F5]/70 dark:bg-slate-800/40 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            {apt.discipline}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            🕒 {apt.startTime} às {apt.endTime}
                          </span>
                          {apt.boxNumber && (
                            <span className="text-xs text-slate-500 font-medium">({apt.boxNumber})</span>
                          )}
                        </div>
                        <h4
                          onClick={() => {
                            setShowDynamicMetricModal(null);
                            handleOpenPatient(apt.patientId);
                          }}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 cursor-pointer"
                        >
                          {apt.patientName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {apt.procedure}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {apt.patientPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWhatsAppApt(apt);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDynamicMetricModal(null);
                            handleOpenPatient(apt.patientId);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                        >
                          Prontuário
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {showDynamicMetricModal === 'in_progress' && (
                inProgressPatients.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                      🦷
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhum tratamento ativo no momento.
                    </p>
                  </div>
                ) : (
                  inProgressPatients.map(p => {
                    const upcomingApt = appointments.find(a => a.patientId === p.id && a.date >= todayStr && a.status !== 'Desmarcado');
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl border border-teal-100 dark:border-slate-800 bg-[#F3F7F5]/70 dark:bg-slate-800/40 hover:border-teal-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                              {p.discipline || 'Clínica Geral'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {p.birthDate ? `Nasc: ${new Date(p.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Prontuário Digital'}
                            </span>
                          </div>
                          <h4
                            onClick={() => {
                              setShowDynamicMetricModal(null);
                              handleOpenPatient(p.id);
                            }}
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 cursor-pointer"
                          >
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {upcomingApt 
                              ? `Próxima consulta: ${new Date(upcomingApt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às ${upcomingApt.startTime} (${upcomingApt.procedure})`
                              : `Em tratamento odontológico • ${p.evolutions?.length || 0} evolução(ões) clínica(s)`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDynamicMetricModal(null);
                              setPreselectedPatientForApt(p);
                              setShowNewAptModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Agendar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDynamicMetricModal(null);
                              handleOpenPatient(p.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                          >
                            Prontuário
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {showDynamicMetricModal === 'waiting_return' && (
                waitingReturnPatients.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl">
                      ✅
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Excelente! Todos os pacientes com histórico clínico já possuem retornos agendados.
                    </p>
                  </div>
                ) : (
                  waitingReturnPatients.map(p => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-amber-200 dark:border-slate-800 bg-[#FFFBEB]/70 dark:bg-amber-950/20 hover:border-amber-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                            Aguardando Retorno
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {p.discipline || 'Clínica Integrada'}
                          </span>
                        </div>
                        <h4
                          onClick={() => {
                            setShowDynamicMetricModal(null);
                            handleOpenPatient(p.id);
                          }}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-amber-700 cursor-pointer"
                        >
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {p.evolutions && p.evolutions.length > 0 
                            ? `Última evolução: ${p.evolutions[p.evolutions.length - 1].procedureDone} (${new Date(p.evolutions[p.evolutions.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR')})`
                            : 'Paciente com ficha ativa sem horário futuro agendado.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.phone && (
                          <a
                            href={`https://wa.me/55${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${p.name}, aqui é ${currentStudent?.name || 'do atendimento odontológico'}. Gostaríamos de agendar sua consulta de retorno clínico!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDynamicMetricModal(null);
                            setPreselectedPatientForApt(p);
                            setShowNewAptModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agendar Retorno
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDynamicMetricModal(null);
                            handleOpenPatient(p.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                        >
                          Prontuário
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowDynamicMetricModal(null);
                  setCurrentTab('calendar');
                }}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" /> Ir para Agenda Completa
              </button>

              <button
                type="button"
                onClick={() => setShowDynamicMetricModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
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

      {/* Mobile Upcoming Appointments Modal / Sheet */}
      {showMobileAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-emerald-100/60 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-800">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Próximos Atendimentos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {upcomingAppointments.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pacientes na cadeira e lembretes WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileAppointmentsModal(false);
                    setShowNewAptModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileAppointmentsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable list of appointments */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhum atendimento agendado para os próximos dias.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileAppointmentsModal(false);
                      setShowNewAptModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs"
                  >
                    Agendar Primeiro Atendimento
                  </button>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-emerald-100/80 dark:border-slate-800 bg-[#F3F7F5]/60 dark:bg-slate-800/40 hover:border-emerald-500/50 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        {apt.discipline}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {apt.startTime} às {apt.endTime}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4
                          onClick={() => {
                            setShowMobileAppointmentsModal(false);
                            handleOpenPatient(apt.patientId);
                          }}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 cursor-pointer flex items-center gap-1"
                        >
                          {apt.patientName}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </h4>
                        {apt.boxNumber && (
                          <span className="text-[11px] text-slate-500 font-medium">{apt.boxNumber}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {apt.procedure}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-100/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWhatsAppApt(apt);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Enviar WhatsApp
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMobileAppointmentsModal(false);
                            handleOpenPatient(apt.patientId);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Prontuário
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAppointment(apt)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remover atendimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowMobileAppointmentsModal(false);
                  setCurrentTab('calendar');
                }}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" /> Ver Calendário Completo
              </button>

              <button
                type="button"
                onClick={() => setShowMobileAppointmentsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
