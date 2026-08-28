import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Patient, DisciplineType } from '../types';
import { PatientModal } from './PatientModal';
import { WhatsAppModal } from './WhatsAppModal';
import { exportPatientClinicalRecordPDF } from '../utils/pdfGenerator';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  FileText, 
  Camera, 
  ShieldAlert, 
  MessageSquare, 
  Download, 
  ChevronRight, 
  Lock, 
  Trash2, 
  Filter, 
  Heart,
  Calendar,
  Sparkles
} from 'lucide-react';

interface PatientsListViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({ onSelectPatient }) => {
  const { patients, deletePatient, disciplines, privacyMode, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [allergyFilter, setAllergyFilter] = useState<boolean>(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [whatsAppPatient, setWhatsAppPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const maskValue = (val: string) => {
    if (!privacyMode) return val;
    if (val.length <= 4) return '****';
    return `${val.substring(0, 3)}.***.***-**`;
  };

  const maskName = (name: string) => {
    if (!privacyMode) return name;
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts.slice(1).map(p => p[0] + '.').join(' ')}`;
  };

  const filteredPatients = patients.filter(patient => {
    if (disciplineFilter !== 'all' && patient.discipline !== disciplineFilter) return false;
    if (allergyFilter && (!patient.anamnese.allergies || patient.anamnese.allergies.length === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = patient.name.toLowerCase().includes(q);
      const matchCpf = patient.cpf.toLowerCase().includes(q);
      const matchRecord = patient.recordNumber.toLowerCase().includes(q);
      const matchPhone = patient.phone.toLowerCase().includes(q);
      if (!matchName && !matchCpf && !matchRecord && !matchPhone) return false;
    }

    return true;
  });

  const handleExportPDF = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    exportPatientClinicalRecordPDF(patient);
    showToast(`Prontuário de ${patient.name} exportado em PDF!`);
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setWhatsAppPatient(patient);
  };

  const handleDelete = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setPatientToDelete(patient);
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      deletePatient(patientToDelete.id);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Gestão de Pacientes & Prontuários ({patients.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histórico clínico, odontograma completo, anexos radiográficos e acompanhamento acadêmico
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPatientModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center gap-2 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Paciente
          </button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do paciente, CPF, prontuário ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Discipline Filter */}
          <div className="sm:col-span-4">
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Todas as Disciplinas</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Allergy Filter Toggle */}
          <div className="sm:col-span-2 flex items-center">
            <button
              type="button"
              onClick={() => setAllergyFilter(prev => !prev)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                allergyFilter
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'border-emerald-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Com Alergias
            </button>
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhum paciente encontrado com esses filtros.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente buscar por outro termo ou cadastre um novo paciente para iniciar o acompanhamento.
          </p>
          <button
            type="button"
            onClick={() => setShowAddPatientModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Cadastrar Paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const hasAllergies = patient.anamnese.allergies && patient.anamnese.allergies.length > 0;
            const toothCount = Object.keys(patient.odontogram || {}).length;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {maskName(patient.name)}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 block">
                          Prontuário: {patient.recordNumber}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 shrink-0">
                      {patient.discipline}
                    </span>
                  </div>

                  {/* Allergy Alert Pill if present */}
                  {hasAllergies && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">Alergia: {patient.anamnese.allergies.join(', ')}</span>
                    </div>
                  )}

                  {/* Clinical info snippet */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-[#F3F7F5]/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-emerald-100/60 dark:border-slate-800 space-y-1">
                    <p className="line-clamp-2 italic text-[11px]">
                      "{patient.anamnese.chiefComplaint}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                      <span>CPF: {maskValue(patient.cpf)}</span>
                      <span>Tel: {patient.phone}</span>
                    </div>
                  </div>

                  {/* Counts tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      {toothCount} Dentes Marcados
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-500" />
                      {patient.evolutions.length} Atendimentos
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-purple-500" />
                      {patient.exams.length} Raios-X
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-emerald-100/60 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, patient)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Enviar lembrete pelo WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleExportPDF(e, patient)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Exportar Prontuário em PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, patient)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir paciente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Ver Prontuário <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Excluir Prontuário?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tem certeza que deseja excluir o cadastro e prontuário de <strong>{patientToDelete.name}</strong>? Esta ação removerá também seus agendamentos.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddPatientModal && (
        <PatientModal
          onClose={() => setShowAddPatientModal(false)}
        />
      )}

      {whatsAppPatient && (
        <WhatsAppModal
          patient={whatsAppPatient}
          onClose={() => setWhatsAppPatient(null)}
        />
      )}
    </div>
  );
};
