import React, { useState } from 'react';
import { Patient, RadiographExam, ToothData } from '../types';
import { useApp } from '../context/AppContext';
import { Odontogram } from './Odontogram';
import { EvolutionModal } from './EvolutionModal';
import { ExamUploadModal } from './ExamUploadModal';
import { RadiographViewerModal } from './RadiographViewerModal';
import { WhatsAppModal } from './WhatsAppModal';
import { PatientModal } from './PatientModal';
import { 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  Camera, 
  Calendar, 
  MessageSquare, 
  Edit3, 
  AlertTriangle, 
  ShieldAlert, 
  Heart, 
  User, 
  Phone, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Lock,
  Eye,
  Maximize2,
  ChevronRight,
  Smartphone,
  RotateCw
} from 'lucide-react';

interface PatientDetailViewProps {
  patient: Patient;
  onBack: () => void;
  onOpenAppointmentModal?: (patientId: string) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack, onOpenAppointmentModal }) => {
  const { updateOdontogramTooth, deletePatientExam, deleteClinicalEvolution, privacyMode } = useApp();

  const [activeTab, setActiveTab] = useState<'odontograma' | 'evolucoes' | 'galeria' | 'anamnese'>('odontograma');
  const [showEvolutionModal, setShowEvolutionModal] = useState<boolean>(false);
  const [showExamUploadModal, setShowExamUploadModal] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState<boolean>(false);
  const [showOdontogramModal, setShowOdontogramModal] = useState<boolean>(false);
  const [activeViewingExam, setActiveViewingExam] = useState<RadiographExam | null>(null);

  const getActiveAllergies = (allergies?: string[]): string[] => {
    if (!allergies || !Array.isArray(allergies)) return [];
    return allergies.filter(a => {
      const clean = a.trim().toLowerCase();
      return clean && 
        clean !== 'nenhuma' && 
        clean !== 'nenhum' && 
        clean !== 'não' && 
        clean !== 'nao' && 
        clean !== 'nega' && 
        clean !== 'não relatada' &&
        clean !== 'não possui' &&
        clean !== 'sem alergias' &&
        clean !== 'sem alergia';
    });
  };

  const activeAllergies = getActiveAllergies(patient.anamnese.allergies);

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

  const handleToothUpdate = (toothNum: number, toothData: ToothData) => {
    updateOdontogramTooth(patient.id, toothNum, toothData);
  };

  const affectedTeeth = Object.values(patient.odontogram || {}).filter(
    t => t.conditions.length > 0 || t.generalCondition || t.notes
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a lista de pacientes
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Lembrete WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setShowEditPatientModal(true)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Editar cadastro"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Profile Card Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            {patient.photoUrl ? (
              <img
                src={patient.photoUrl}
                alt={patient.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shadow-emerald-700/10 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
                {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {maskName(patient.name)}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  {patient.discipline}
                </span>
                {privacyMode && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Modo Sigilo
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Prontuário: <strong className="text-slate-800 dark:text-slate-200 font-mono">{patient.recordNumber}</strong></span>
                <span>CPF: <strong className="text-slate-800 dark:text-slate-200 font-mono">{maskValue(patient.cpf)}</strong></span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on header */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setShowEvolutionModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nova Evolução
            </button>
            <button
              type="button"
              onClick={() => setShowExamUploadModal(true)}
              className="px-3.5 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-emerald-600" /> Anexar Raio-X / Foto
            </button>
            {onOpenAppointmentModal && (
              <button
                type="button"
                onClick={() => onOpenAppointmentModal(patient.id)}
                className="px-3.5 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-emerald-600" /> Agendar Box
              </button>
            )}
          </div>
        </div>

        {/* High Alert Banner ONLY if Patient actually has Allergies */}
        {activeAllergies.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <strong className="font-bold uppercase tracking-wider block text-[11px] text-rose-700 dark:text-rose-400">
                Alerta Médico / Alergia Importante:
              </strong>
              {activeAllergies.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Internal Navigation Tabs (Cleaned, without PDF/Terms) */}
      <div className="flex border-b border-emerald-100 dark:border-slate-800 overflow-x-auto text-xs font-semibold gap-2 pb-1">
        {[
          { id: 'odontograma', label: 'Odontograma Interativo', icon: Sparkles },
          { id: 'evolucoes', label: `Evolução Clínica (${patient.evolutions.length})`, icon: FileText },
          { id: 'galeria', label: `Galeria & Radiografias (${patient.exams.length})`, icon: Camera },
          { id: 'anamnese', label: 'Anamnese & Histórico Médico', icon: Heart }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-[#F3F7F5] dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Odontograma - Summary card with direct full-screen access button */}
      {activeTab === 'odontograma' && (
        <div className="space-y-4">
          {/* Main Action Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Odontograma Anatômico Interativo 2D
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {affectedTeeth.length > 0
                  ? `${affectedTeeth.length} dente(s) com anotações e procedimentos registrados`
                  : 'Nenhum dente com patologia registrada. Todos os elementos íntegros/hígidos.'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>No celular, vire a tela na horizontal (paisagem) para ver todos os dentes com perfeição.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOdontogramModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
            >
              <Maximize2 className="w-4 h-4" />
              Acessar Odontograma Completo
            </button>
          </div>

          {/* Detailed Summary List of Diagnosed/Noted Teeth */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100/60 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Resumo dos Elementos Dentais Diagnosticados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lista rápida de dentes com cáries, restaurações, canal ou observações
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOdontogramModal(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Editar no Mapa 2D</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {affectedTeeth.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Arcada dentária íntegra e sem anotações
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Clique no botão acima para abrir o mapa anatômico interativo e registrar dentes, faces ou condições.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {affectedTeeth.map((tooth) => (
                  <div
                    key={tooth.toothNumber}
                    onClick={() => setShowOdontogramModal(true)}
                    className="p-3.5 rounded-2xl border border-emerald-100 dark:border-slate-800 bg-[#F3F7F5]/50 dark:bg-slate-800/40 hover:border-emerald-500/60 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs">
                        Dente #{tooth.toothNumber}
                      </span>
                      {tooth.generalCondition && (
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          {tooth.generalCondition.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {tooth.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tooth.conditions.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            >
                              Face {c.surface}: {c.condition}
                            </span>
                          ))}
                        </div>
                      )}
                      {tooth.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{tooth.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen/Modal Odontogram with rotation optimization */}
      {showOdontogramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-6xl w-full max-h-[98vh] h-full sm:h-auto flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Odontograma Anatômico - {patient.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Prontuário: {patient.recordNumber} • Toque em qualquer dente para anotar faces
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOdontogramModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                Concluir & Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <Odontogram
                odontogram={patient.odontogram}
                onToothUpdate={handleToothUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Evolução Clínica */}
      {activeTab === 'evolucoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Histórico de Procedimentos & Acompanhamento Acadêmico
            </h3>
            <button
              type="button"
              onClick={() => setShowEvolutionModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Atendimento
            </button>
          </div>

          {patient.evolutions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhuma evolução clínica registrada ainda.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Registre cada atendimento com a técnica realizada, anestésico e visto do professor.
              </p>
              <button
                type="button"
                onClick={() => setShowEvolutionModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Registrar Primeiro Atendimento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patient.evolutions.map((evo) => (
                <div
                  key={evo.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {evo.discipline}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Data: {new Date(evo.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {evo.teethInvolved && (
                        <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">
                          Dente(s): {evo.teethInvolved}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {evo.evaluatedGrade && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                          Nota: {evo.evaluatedGrade}
                        </span>
                      )}
                      {evo.signedByProfessor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Visto Docente OK
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold">
                          Visto Pendente
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteClinicalEvolution(patient.id, evo.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                        title="Excluir evolução"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {evo.procedureDone}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {evo.anestheticUsed && (
                      <span>Anestesia: <strong className="text-slate-700 dark:text-slate-300">{evo.anestheticUsed} ({evo.tubesUsed || 1} tubete)</strong></span>
                    )}
                    <span>Supervisor: <strong className="text-slate-700 dark:text-slate-300">{evo.professor}</strong></span>
                  </div>

                  {evo.postOpObservations && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">Recomendações Pós-Op:</strong> {evo.postOpObservations}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Galeria & Radiografias */}
      {activeTab === 'galeria' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-600" />
                Exames Radiográficos & Fotografias Clínicas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique em qualquer exame para abrir o visualizador de alta resolução com filtros de contraste e negativo
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExamUploadModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Anexar Exame
            </button>
          </div>

          {patient.exams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum exame radiográfico ou foto anexada.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Anexe periapicais, panorâmicas e fotos intraorais com laudo para acompanhamento.
              </p>
              <button
                type="button"
                onClick={() => setShowExamUploadModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Anexar Primeiro Exame
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {patient.exams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => setActiveViewingExam(exam)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={exam.imageUrl}
                      alt={exam.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {exam.type.toUpperCase()}
                    </span>
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" /> Visualizar
                    </div>
                  </div>

                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {exam.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(exam.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {exam.teethReferenced ? `Dente ${exam.teethReferenced}` : 'Arcada'}
                      </p>
                      {exam.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2 mt-1">
                          "{exam.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">Clique para abrir</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatientExam(patient.id, exam.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Excluir exame"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Anamnese & Histórico Médico */}
      {activeTab === 'anamnese' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              1. Queixa Principal & História Médica
            </h3>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Queixa Principal:</span>
              <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 font-medium bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                "{patient.anamnese.chiefComplaint}"
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">História da Moléstia Atual:</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {patient.anamnese.currentIllnessHistory || 'Sem outras manifestações associadas.'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Última Visita Odontológica:</span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {patient.anamnese.lastDentalVisit || 'Não informado.'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              2. Sinais Vitais & Medicamentos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Pressão Arterial:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {patient.anamnese.vitalSigns.bloodPressure || 'Não aferida'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <span className="text-[11px] text-slate-500 block">Frequência Cardíaca:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {patient.anamnese.vitalSigns.heartRate || 'Não informada'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Medicamentos em Uso Contínuo:</span>
              {patient.anamnese.continuousMedications.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {patient.anamnese.continuousMedications.map((m, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Nenhum medicamento de uso contínuo relatado.</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Hábitos / Parafunções:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {patient.anamnese.habits.smoker && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Fumante</span>}
                {patient.anamnese.habits.alcohol && <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Etilista</span>}
                {patient.anamnese.habits.bruxism && <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Bruxismo/Aperto</span>}
                {patient.anamnese.habits.nailBiting && <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Onicofagia</span>}
                {!patient.anamnese.habits.smoker && !patient.anamnese.habits.alcohol && !patient.anamnese.habits.bruxism && !patient.anamnese.habits.nailBiting && (
                  <span className="text-xs text-slate-500">Nenhum hábito deletério relatado.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEvolutionModal && (
        <EvolutionModal
          patientId={patient.id}
          patientName={patient.name}
          onClose={() => setShowEvolutionModal(false)}
        />
      )}

      {showExamUploadModal && (
        <ExamUploadModal
          patientId={patient.id}
          patientName={patient.name}
          onClose={() => setShowExamUploadModal(false)}
        />
      )}

      {showWhatsAppModal && (
        <WhatsAppModal
          patient={patient}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {showEditPatientModal && (
        <PatientModal
          patient={patient}
          onClose={() => setShowEditPatientModal(false)}
        />
      )}

      {activeViewingExam && (
        <RadiographViewerModal
          exam={activeViewingExam}
          allExams={patient.exams}
          onClose={() => setActiveViewingExam(null)}
        />
      )}
    </div>
  );
};
