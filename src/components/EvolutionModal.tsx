import React, { useState } from 'react';
import { DisciplineType, DisciplineConfig } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface EvolutionModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({ patientId, patientName, onClose }) => {
  const { addClinicalEvolution, disciplines } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [discipline, setDiscipline] = useState<DisciplineType>('Dentística Restauradora');
  const [professor, setProfessor] = useState<string>('Prof. Dr. Ricardo Silva');
  const [procedureDone, setProcedureDone] = useState<string>('');
  const [anestheticUsed, setAnestheticUsed] = useState<string>('Articaína 4% 1:100.000');
  const [tubesUsed, setTubesUsed] = useState<number>(1);
  const [teethInvolved, setTeethInvolved] = useState<string>('');
  const [postOpObservations, setPostOpObservations] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [evaluatedGrade, setEvaluatedGrade] = useState<string>('10.0');
  const [signedByProfessor, setSignedByProfessor] = useState<boolean>(true);

  const handleDisciplineChange = (name: DisciplineType) => {
    setDiscipline(name);
    const found = disciplines.find(d => d.name === name);
    if (found) {
      setProfessor(found.professor);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureDone.trim()) return;

    addClinicalEvolution(patientId, {
      date,
      discipline,
      professor,
      procedureDone,
      anestheticUsed,
      tubesUsed,
      teethInvolved,
      postOpObservations,
      studentNotes,
      evaluatedGrade,
      signedByProfessor
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Nova Evolução Clínica & Procedimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paciente: <strong className="text-slate-800 dark:text-slate-200">{patientName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Atendimento:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disciplina Clínica:
              </label>
              <select
                value={discipline}
                onChange={(e) => handleDisciplineChange(e.target.value as DisciplineType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                {disciplines.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professor Supervisor:
              </label>
              <input
                type="text"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Detalhada do Procedimento Realizado * :
            </label>
            <textarea
              required
              rows={4}
              value={procedureDone}
              onChange={(e) => setProcedureDone(e.target.value)}
              placeholder="Ex: Anestesia infiltrativa, isolamento absoluto, remoção de tecido cariado no elemento 16, preparo classe II MO, restauração em resina composta Z350 cor A2B, ajuste oclusal..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anestésico Utilizado:
              </label>
              <input
                type="text"
                value={anestheticUsed}
                onChange={(e) => setAnestheticUsed(e.target.value)}
                placeholder="Ex: Articaína 4% 1:100.000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qtd. Tubetes:
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={tubesUsed}
                onChange={(e) => setTubesUsed(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dente(s) Envolvido(s):
              </label>
              <input
                type="text"
                value={teethInvolved}
                onChange={(e) => setTeethInvolved(e.target.value)}
                placeholder="Ex: 16, 21, 36"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recomendações e Orientações Pós-Operatórias dadas ao Paciente:
            </label>
            <input
              type="text"
              value={postOpObservations}
              onChange={(e) => setPostOpObservations(e.target.value)}
              placeholder="Ex: Cuidado mastigatório com a anestesia, compressa fria, retorno em 7 dias para polimento..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nota / Conceito Atribuído pelo Docente:
              </label>
              <input
                type="text"
                value={evaluatedGrade}
                onChange={(e) => setEvaluatedGrade(e.target.value)}
                placeholder="Ex: 10.0 / 10.0 ou Aprovado"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="signCheck"
                checked={signedByProfessor}
                onChange={(e) => setSignedByProfessor(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="signCheck" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Visto do Professor Validado no Prontuário Físico
              </label>
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
              className="px-5 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Salvar Evolução Clínica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
