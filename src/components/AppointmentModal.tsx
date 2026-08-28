import React, { useState } from 'react';
import { Appointment, DisciplineType, AppointmentStatus } from '../types';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AppointmentModalProps {
  appointment?: Appointment;
  initialPatientId?: string;
  onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ appointment, initialPatientId, onClose }) => {
  const { patients, disciplines, addAppointment, updateAppointment, showToast } = useApp();

  const [patientId, setPatientId] = useState<string>(appointment?.patientId || initialPatientId || (patients[0]?.id || ''));
  const [date, setDate] = useState<string>(appointment?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>(appointment?.startTime || '14:00');
  const [endTime, setEndTime] = useState<string>(appointment?.endTime || '16:30');
  const [discipline, setDiscipline] = useState<DisciplineType>(appointment?.discipline || 'Dentística Restauradora');
  const [procedure, setProcedure] = useState<string>(appointment?.procedure || '');
  const [boxNumber, setBoxNumber] = useState<string>(appointment?.boxNumber || 'Box 04');
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status || 'Agendado');
  const [notes, setNotes] = useState<string>(appointment?.notes || '');

  const selectedPatient = patients.find(p => p.id === patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast('Selecione um paciente para agendar.', 'warning');
      return;
    }
    if (!procedure.trim()) {
      showToast('Informe o procedimento planejado.', 'warning');
      return;
    }

    const payload = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      date,
      startTime,
      endTime,
      discipline,
      procedure,
      boxNumber,
      status,
      notes,
      remindedViaWhatsApp: appointment?.remindedViaWhatsApp || false
    };

    if (appointment) {
      updateAppointment(appointment.id, payload);
    } else {
      addAppointment(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {appointment ? 'Editar Agendamento Clínico' : 'Novo Agendamento de Paciente'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reserva de cadeira clínica e organização acadêmica
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

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 overflow-y-auto flex-1 pr-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Selecione o Paciente * :
            </label>
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                const p = patients.find(pat => pat.id === e.target.value);
                if (p) setDiscipline(p.discipline);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.recordNumber}) - Tel: {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Atendimento:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disciplina Odontológica:
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {disciplines.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário Início:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário Fim:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cadeira / Box:
              </label>
              <input
                type="text"
                value={boxNumber}
                onChange={(e) => setBoxNumber(e.target.value)}
                placeholder="Ex: Box 04"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Procedimento Planejado * :
            </label>
            <input
              type="text"
              required
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="Ex: Restauração Classe II dente 16 / Moldagem para Prótese"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status da Consulta:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="Agendado">Agendado</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Concluído">Concluído</option>
                <option value="Faltou">Faltou</option>
                <option value="Desmarcado">Desmarcado</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materiais / Checklist para a Sessão:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Levar pontas diamantadas e fita de isolamento"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {appointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
