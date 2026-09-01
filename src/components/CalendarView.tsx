import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, DisciplineType, TaskItem, AcademicNotice } from '../types';
import { AppointmentModal } from './AppointmentModal';
import { WhatsAppModal } from './WhatsAppModal';
import confetti from 'canvas-confetti';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Sparkles,
  User,
  Trash2,
  CalendarDays,
  ListFilter,
  Phone,
  CheckSquare,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Layers
} from 'lucide-react';

const STATUS_BADGE_STYLES: Record<string, string> = {
  Agendado: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Confirmado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Em Atendimento': 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 animate-pulse',
  Concluído: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  Faltou: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  Desmarcado: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
};

const DISCIPLINE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Dentística Restauradora': { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  'Endodontia': { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  'Periodontia': { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
  'Cirurgia & Traumatologia': { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
  'Prótese Dentária': { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  'Odontopediatria': { bg: 'bg-pink-50 dark:bg-pink-950/50', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800', dot: 'bg-pink-500' },
  'Ortodontia': { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  'Semiologia & Diagnóstico': { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' }
};

const TASK_CATEGORY_ICONS: Record<string, string> = {
  'Esterilização': '🧼',
  'Laboratório': '🔬',
  'Acadêmico': '📚',
  'Estudo/Prova': '📝',
  'Prontuário & Caso': '📋',
  'Material de Aula': '🎒',
  'Geral': '📌',
  'Outro': '📌'
};

export const CalendarView: React.FC = () => {
  const { 
    appointments, 
    disciplines, 
    notices, 
    tasks, 
    patients, 
    toggleTask, 
    updateAppointment, 
    deleteAppointment, 
    setSelectedPatientId, 
    setCurrentTab,
    showToast 
  } = useApp();

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'appointments' | 'tasks'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [whatsAppTarget, setWhatsAppTarget] = useState<{ patient: any; appointment: Appointment } | null>(null);

  // Month navigation
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const filteredAppointments = appointments.filter(apt => {
    if (selectedDiscipline !== 'all' && apt.discipline !== selectedDiscipline) return false;
    return true;
  });

  const filteredTasks = tasks.filter(t => {
    if (selectedDiscipline !== 'all' && t.discipline && t.discipline !== selectedDiscipline) return false;
    return true;
  });

  const filteredNotices = notices.filter(n => {
    if (selectedDiscipline !== 'all' && n.discipline !== selectedDiscipline) return false;
    return true;
  });

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const monthName = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const getAppointmentsForDay = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return filteredAppointments.filter(a => a.date === dayStr);
  };

  const getTasksForDay = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return filteredTasks.filter(t => t.dueDate === dayStr);
  };

  const getNoticesForDay = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return filteredNotices.filter(n => n.date === dayStr);
  };

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    toggleTask(taskId);
    if (!currentCompleted) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 }
      });
      showToast('Tarefa marcada como concluída!');
    }
  };

  const handleOpenWhatsApp = (apt: Appointment) => {
    const patient = patients.find(p => p.id === apt.patientId) || {
      id: apt.patientId,
      name: apt.patientName,
      phone: apt.patientPhone,
      discipline: apt.discipline
    };
    setWhatsAppTarget({ patient, appointment: apt });
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentTab('patients');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-100/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Calendário Clínico & Acadêmico
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Atendimentos a pacientes, provas, trabalhos e tarefas da dupla sincronizados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline filter */}
          <div className="flex items-center gap-1.5 bg-[#F3F7F5]/80 dark:bg-slate-800 px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden cursor-pointer max-w-[140px] sm:max-w-none truncate"
            >
              <option value="all">Todas as Disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Event type filter */}
          <div className="flex items-center gap-1.5 bg-[#F3F7F5]/80 dark:bg-slate-800 px-2.5 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 text-xs">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todos os Eventos</option>
              <option value="appointments">🦷 Apenas Pacientes</option>
              <option value="tasks">📝 Tarefas, Provas & Trabalhos</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="bg-[#F3F7F5]/80 dark:bg-slate-800 p-1 rounded-xl flex text-xs font-semibold border border-emerald-100/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Agenda ({filteredAppointments.length + filteredTasks.length})
            </button>
          </div>

          {/* Single Top Action Button */}
          <button
            type="button"
            onClick={() => {
              setEditingAppointment(undefined);
              setShowAppointmentModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Agendar Atendimento
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
              {monthName}
            </h3>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonthDate(new Date());
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-emerald-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-slate-800 text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-extrabold text-slate-500 dark:text-slate-400 py-0.5 sm:py-1 uppercase tracking-wider">
            <span className="text-rose-500">Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {blankDays.map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[48px] sm:min-h-24 md:min-h-28 p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 border border-transparent" />
            ))}

            {daysArray.map((dayNum) => {
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayAppointments = getAppointmentsForDay(dayNum);
              const dayTasks = getTasksForDay(dayNum);
              const dayNotices = getNoticesForDay(dayNum);
              
              const isToday = dayStr === new Date().toISOString().split('T')[0];
              const isSelected = dayStr === selectedDate;
              const totalItems = (eventTypeFilter === 'tasks' ? 0 : dayAppointments.length) + 
                                 (eventTypeFilter === 'appointments' ? 0 : dayTasks.length) + 
                                 (eventTypeFilter === 'appointments' ? 0 : dayNotices.length);

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`min-h-[48px] sm:min-h-24 md:min-h-28 p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/50 shadow-xs'
                      : isToday
                      ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-sm font-extrabold w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {totalItems > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-white bg-emerald-600 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full shadow-xs">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Calendar Cell Content (Appointments, Tasks, Notices) */}
                  <div className="space-y-0.5 sm:space-y-1 my-0.5 sm:my-1 overflow-hidden">
                    {/* Desktop / Tablet view */}
                    <div className="hidden sm:block space-y-1">
                      {/* Patient Appointments */}
                      {eventTypeFilter !== 'tasks' && dayAppointments.slice(0, 2).map((apt) => {
                        const discStyle = DISCIPLINE_COLORS[apt.discipline] || { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' };
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAppointment(apt);
                              setShowAppointmentModal(true);
                            }}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate border flex items-center gap-1 transition-transform hover:scale-102 ${discStyle.bg} ${discStyle.text} ${discStyle.border}`}
                            title={`Paciente: ${apt.startTime} - ${apt.patientName} (${apt.discipline})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${discStyle.dot}`} />
                            <span className="font-extrabold">{apt.startTime}</span>
                            <span className="truncate">{apt.patientName.split(' ')[0]}</span>
                          </div>
                        );
                      })}

                      {/* Tasks, Exams & Homework */}
                      {eventTypeFilter !== 'appointments' && dayTasks.slice(0, 2).map((tsk) => {
                        const icon = TASK_CATEGORY_ICONS[tsk.category] || '📝';
                        return (
                          <div
                            key={tsk.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate border flex items-center gap-1 ${
                              tsk.completed
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 line-through'
                                : tsk.category === 'Estudo/Prova'
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200'
                            }`}
                            title={`Tarefa/Prova: ${tsk.title} (${tsk.category})`}
                          >
                            <span className="shrink-0">{icon}</span>
                            <span className="truncate">{tsk.title}</span>
                          </div>
                        );
                      })}

                      {/* Academic Notices */}
                      {eventTypeFilter !== 'appointments' && dayNotices.slice(0, 1).map((not) => (
                        <div
                          key={not.id}
                          className="text-[8px] font-bold px-1 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 truncate border border-rose-200 flex items-center gap-1"
                          title={`Prazo Acadêmico: ${not.title}`}
                        >
                          <span>⚠️</span>
                          <span className="truncate">{not.title}</span>
                        </div>
                      ))}

                      {totalItems > 3 && (
                        <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 block text-center bg-emerald-100/60 dark:bg-emerald-950/60 rounded-md py-0.2">
                          +{totalItems - 3} mais
                        </span>
                      )}
                    </div>

                    {/* Compact Mobile Indicators (dots) */}
                    <div className="sm:hidden flex flex-wrap gap-1 items-center justify-center pt-0.5">
                      {eventTypeFilter !== 'tasks' && dayAppointments.slice(0, 2).map((apt) => {
                        const discStyle = DISCIPLINE_COLORS[apt.discipline] || { dot: 'bg-emerald-500' };
                        return (
                          <span
                            key={apt.id}
                            className={`w-1.5 h-1.5 rounded-full ${discStyle.dot}`}
                            title={`Paciente: ${apt.patientName}`}
                          />
                        );
                      })}
                      {eventTypeFilter !== 'appointments' && dayTasks.slice(0, 2).map((tsk) => (
                        <span
                          key={tsk.id}
                          className={`w-1.5 h-1.5 rounded-full ${tsk.category === 'Estudo/Prova' ? 'bg-purple-500' : 'bg-amber-500'}`}
                          title={`Tarefa/Prova: ${tsk.title}`}
                        />
                      ))}
                      {eventTypeFilter !== 'appointments' && dayNotices.slice(0, 1).map((not) => (
                        <span
                          key={not.id}
                          className="w-1.5 h-1.5 rounded-full bg-rose-500"
                          title={`Aviso: ${not.title}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {/* spacer */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day / Detailed Agenda List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              {viewMode === 'month' ? (
                <>
                  Programação de: <span className="text-emerald-700 dark:text-emerald-300 capitalize">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </>
              ) : (
                'Visão Geral de Todos os Atendimentos e Tarefas'
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pacientes agendados, trabalhos, avaliações teóricas e preparo de material
            </p>
          </div>
        </div>

        {/* Selected day content */}
        {(() => {
          const listAppointments = viewMode === 'month'
            ? filteredAppointments.filter(a => a.date === selectedDate)
            : filteredAppointments;

          const listTasks = viewMode === 'month'
            ? filteredTasks.filter(t => t.dueDate === selectedDate)
            : filteredTasks;

          const listNotices = viewMode === 'month'
            ? filteredNotices.filter(n => n.date === selectedDate)
            : filteredNotices;

          const showAppointments = eventTypeFilter === 'all' || eventTypeFilter === 'appointments';
          const showTasks = eventTypeFilter === 'all' || eventTypeFilter === 'tasks';

          const hasAny = (showAppointments && listAppointments.length > 0) || 
                         (showTasks && (listTasks.length > 0 || listNotices.length > 0));

          if (!hasAny) {
            return (
              <div className="py-8 sm:py-10 text-center text-slate-400">
                <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum atendimento, prova ou tarefa para esta data.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Utilize o botão superior para agendar novos pacientes ou adicione tarefas na aba de Checklist.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* 1. Clinical Appointments Section */}
              {showAppointments && listAppointments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Atendimentos Clínicos ({listAppointments.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {listAppointments.map((apt) => {
                      const discStyle = DISCIPLINE_COLORS[apt.discipline] || { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' };

                      return (
                        <div
                          key={apt.id}
                          className="bg-[#F3F7F5]/40 dark:bg-slate-800/40 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-4 sm:p-5 space-y-3 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            {/* Status and Time badges */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_BADGE_STYLES[apt.status] || ''}`}>
                                {apt.status}
                              </span>
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {apt.date} • {apt.startTime} às {apt.endTime}
                              </span>
                            </div>

                            {/* Patient & Discipline */}
                            <div>
                              <h4
                                onClick={() => handleViewPatient(apt.patientId)}
                                className="text-base font-extrabold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-2"
                              >
                                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                                  {apt.patientName.charAt(0)}
                                </div>
                                {apt.patientName}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${discStyle.bg} ${discStyle.text} ${discStyle.border}`}>
                                  {apt.discipline}
                                </span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  {apt.boxNumber || 'Box Não Definido'}
                                </span>
                              </div>
                            </div>

                            {/* Procedure Description */}
                            <div className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100/60 dark:border-slate-800 space-y-1">
                              <p>
                                <strong className="text-emerald-700 dark:text-emerald-400">Procedimento:</strong> {apt.procedure}
                              </p>
                              {apt.patientPhone && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" /> {apt.patientPhone}
                                </p>
                              )}
                            </div>

                            {apt.notes && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60">
                                <strong>Checklist / Recado:</strong> {apt.notes}
                              </p>
                            )}
                          </div>

                          {/* Actions on card */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-emerald-100/60 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(apt)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Lembrete WhatsApp
                            </button>

                            <div className="flex items-center gap-1.5">
                              <select
                                value={apt.status}
                                onChange={(e) => updateAppointment(apt.id, { status: e.target.value as any })}
                                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                              >
                                <option value="Agendado">Agendado</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Em Atendimento">Em Atendimento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Faltou">Faltou</option>
                                <option value="Desmarcado">Desmarcado</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAppointment(apt);
                                  setShowAppointmentModal(true);
                                }}
                                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 px-2 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Editar agendamento"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteAppointment(apt.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Excluir agendamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Tasks, Exams & Deadlines Section */}
              {showTasks && (listTasks.length > 0 || listNotices.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Tarefas da Dupla, Provas & Trabalhos ({listTasks.length + listNotices.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Tasks items */}
                    {listTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          task.completed
                            ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/60 opacity-80'
                            : task.category === 'Estudo/Prova'
                            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/60 hover:border-purple-400'
                            : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id, task.completed)}
                            className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />

                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{TASK_CATEGORY_ICONS[task.category] || '📝'}</span>
                              <p className={`text-xs font-extrabold text-slate-900 dark:text-slate-100 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                {task.title}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="px-2 py-0.5 rounded-md font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {task.category}
                              </span>
                              {task.discipline && (
                                <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {task.discipline}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                                <User className="w-3 h-3 text-slate-400" /> {task.assignedTo}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                          task.priority === 'alta'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}

                    {/* Academic Notices */}
                    {listNotices.map((notice) => (
                      <div
                        key={notice.id}
                        className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>⚠️</span>
                            {notice.title}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                            {notice.type}
                          </span>
                        </div>

                        {notice.description && (
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                            {notice.description}
                          </p>
                        )}

                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
                          Disciplina: {notice.discipline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      {showAppointmentModal && (
        <AppointmentModal
          appointment={editingAppointment}
          onClose={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(undefined);
          }}
        />
      )}

      {whatsAppTarget && (
        <WhatsAppModal
          patient={whatsAppTarget.patient}
          appointment={whatsAppTarget.appointment}
          onClose={() => setWhatsAppTarget(null)}
        />
      )}
    </div>
  );
};
