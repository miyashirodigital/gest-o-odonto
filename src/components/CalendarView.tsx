import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, DisciplineType } from '../types';
import { AppointmentModal } from './AppointmentModal';
import { WhatsAppModal } from './WhatsAppModal';
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
  Trash2
} from 'lucide-react';

const STATUS_BADGE_STYLES: Record<string, string> = {
  Agendado: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Confirmado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Em Atendimento': 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 animate-pulse',
  Concluído: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  Faltou: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  Desmarcado: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
};

export const CalendarView: React.FC = () => {
  const { appointments, disciplines, notices, patients, updateAppointment, deleteAppointment, setSelectedPatientId, setCurrentTab } = useApp();

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
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

  const getNoticesForDay = (dayNum: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return notices.filter(n => n.date === dayStr);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-100/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Calendário Acadêmico & Agendamento por Disciplina
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhamento de atendimentos clínicos, box reservados e prazos acadêmicos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline filter */}
          <div className="flex items-center gap-1.5 bg-[#F3F7F5]/50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todas as Disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="bg-[#F3F7F5]/80 dark:bg-slate-800 p-1 rounded-xl flex text-xs font-semibold border border-emerald-100/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lista / Agenda ({filteredAppointments.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingAppointment(undefined);
              setShowAppointmentModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-4 md:p-6 shadow-xs space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize">
              {monthName}
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 py-1">
            <span>Dom</span>
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
              <div key={`blank-${i}`} className="min-h-24 p-1.5 rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 border border-transparent" />
            ))}

            {daysArray.map((dayNum) => {
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = new Date().toISOString().split('T')[0] === dayStr;
              const isSelected = selectedDate === dayStr;
              const dayAppointments = getAppointmentsForDay(dayNum);
              const dayNotices = getNoticesForDay(dayNum);

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(dayStr)}
                  className={`min-h-24 sm:min-h-28 p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30'
                      : isToday
                      ? 'border-emerald-300 dark:border-emerald-700 bg-slate-50/80 dark:bg-slate-800/50'
                      : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-full">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments pills inside cell */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAppointment(apt);
                          setShowAppointmentModal(true);
                        }}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 truncate border border-emerald-200/60 dark:border-emerald-800/60 hover:scale-102 transition-transform"
                        title={`${apt.startTime} - ${apt.patientName} (${apt.procedure})`}
                      >
                        {apt.startTime} {apt.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <span className="text-[9px] font-bold text-slate-400 block text-center">
                        +{dayAppointments.length - 2} mais
                      </span>
                    )}

                    {/* Academic Notices on Calendar */}
                    {dayNotices.map((not) => (
                      <div
                        key={not.id}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 truncate border border-amber-300"
                        title={`Prazo Acadêmico: ${not.title}`}
                      >
                        ⚠️ {not.title}
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {/* empty bottom spacer */}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day / Agenda List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Atendimentos Marcados ({viewMode === 'month' ? `Data: ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}` : 'Todos os agendamentos'})
          </h3>

          <button
            type="button"
            onClick={() => {
              setEditingAppointment(undefined);
              setShowAppointmentModal(true);
            }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar na Agenda
          </button>
        </div>

        {/* Filtered appointments list */}
        {(() => {
          const list = viewMode === 'month'
            ? filteredAppointments.filter(a => a.date === selectedDate)
            : filteredAppointments;

          if (list.length === 0) {
            return (
              <div className="py-8 text-center text-slate-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Nenhum atendimento agendado para esta data.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAppointment(undefined);
                    setShowAppointmentModal(true);
                  }}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Agendar Novo Paciente
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_BADGE_STYLES[apt.status] || ''}`}>
                        {apt.status}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.date} • {apt.startTime} às {apt.endTime}
                      </span>
                    </div>

                    <div>
                      <h4
                        onClick={() => handleViewPatient(apt.patientId)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex items-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        {apt.patientName}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {apt.discipline} • <span className="text-slate-600 dark:text-slate-300">{apt.boxNumber}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <strong>Procedimento:</strong> {apt.procedure}
                    </p>

                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Checklist: {apt.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions on card */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(apt)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Lembrete WhatsApp
                    </button>

                    <div className="flex items-center gap-1">
                      <select
                        value={apt.status}
                        onChange={(e) => updateAppointment(apt.id, { status: e.target.value as any })}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold cursor-pointer"
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
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Editar agendamento"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAppointment(apt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
