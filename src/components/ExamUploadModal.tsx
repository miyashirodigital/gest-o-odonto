import React, { useState } from 'react';
import { RadiographExam } from '../types';
import { X, Upload, Camera, Image, Tag, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ExamUploadModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

const SAMPLE_DENTAL_IMAGES = [
  {
    type: 'Periapical' as const,
    title: 'Radiografia Periapical de Elemento Posterior',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80',
    notes: 'Exame periapical com técnica do paralelismo. Avaliação de cristas ósseas e ápice radicular.'
  },
  {
    type: 'Panorâmica' as const,
    title: 'Radiografia Panorâmica Completa',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
    notes: 'Visão global das arcadas dentárias, seios maxilares e articulações temporomandibulares.'
  },
  {
    type: 'Foto Intraoral' as const,
    title: 'Fotografia Clínica Intraoral de Caso',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=80',
    notes: 'Registro fotográfico com espelho e contraste negro para acompanhamento de caso clínico.'
  }
];

export const ExamUploadModal: React.FC<ExamUploadModalProps> = ({ patientId, patientName, onClose }) => {
  const { addPatientExam, showToast } = useApp();

  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<RadiographExam['type']>('Periapical');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_DENTAL_IMAGES[0].url);
  const [teethReferenced, setTeethReferenced] = useState<string>('16');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('Pré-Operatório');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
        showToast('Arquivo de imagem carregado para visualização!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_DENTAL_IMAGES[0]) => {
    setImageUrl(sample.url);
    setType(sample.type);
    setTitle(sample.title);
    setNotes(sample.notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      showToast('Por favor selecione ou carregue uma imagem.', 'warning');
      return;
    }

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);

    addPatientExam(patientId, {
      title: title || `Exame ${type} - ${new Date().toLocaleDateString('pt-BR')}`,
      type,
      date,
      imageUrl,
      teethReferenced,
      diagnosis,
      notes,
      tags
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              Anexar Exame Radiográfico ou Foto Clínica
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
          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50 relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Clique para selecionar ou arraste o arquivo do Raio-X / Foto
              </p>
              <p className="text-[11px] text-slate-400">
                Suporta JPG, PNG, DICOM convertida e fotos de celular da radiografia no negatoscópio
              </p>
            </div>
          </div>

          {/* Quick Dental Samples for testing */}
          <div>
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Ou utilize uma amostra odontológica de alta definição:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_DENTAL_IMAGES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    imageUrl === s.url
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <img src={s.url} alt={s.title} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{s.type}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{s.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="p-3 bg-slate-900 rounded-2xl flex items-center justify-center max-h-48 overflow-hidden">
              <img src={imageUrl} alt="Prévia do exame" className="max-h-44 object-contain rounded-lg" referrerPolicy="no-referrer" />
            </div>
          )}

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Exame:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RadiographExam['type'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Periapical">Periapical</option>
                <option value="Interproximal (Bite-wing)">Interproximal (Bite-wing)</option>
                <option value="Panorâmica">Panorâmica dos Maxilares</option>
                <option value="Oclusal">Oclusal</option>
                <option value="Telerradiografia">Telerradiografia / Cefalométrica</option>
                <option value="Tomografia">Tomografia Cone Beam</option>
                <option value="Foto Intraoral">Foto Intraoral</option>
                <option value="Foto Extraoral">Foto Extraoral / Sorriso</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Exame:
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
                Dente(s) de Referência:
              </label>
              <input
                type="text"
                value={teethReferenced}
                onChange={(e) => setTeethReferenced(e.target.value)}
                placeholder="Ex: 16, 21, 38, 48"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título / Identificação do Exame:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Periapical Dente 16 Pré-Operatório"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Laudo / Observações Radiográficas:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Área radiolúcida em coroa, sem alargamento do espaço periodontal..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Diagnóstico / Conduta:
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Ex: Cárie ocluso-mesial em dente 16"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags (separadas por vírgula):
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Pré-operatório, Dentística, Resina"
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
              Salvar Exame na Galeria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
