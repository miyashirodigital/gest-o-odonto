import React, { useState } from 'react';
import { ToothData, ToothCondition, ToothSurface } from '../types';
import { Sparkles, Info, RotateCcw, X, Plus } from 'lucide-react';

interface OdontogramProps {
  odontogram: Record<number, ToothData>;
  onToothUpdate?: (toothNumber: number, data: ToothData) => void;
  readOnly?: boolean;
}

const CONDITION_COLORS: Record<ToothCondition, { bg: string; text: string; label: string; border: string }> = {
  higido: { bg: '#ffffff', text: '#64748b', label: 'Hígido (Íntegro)', border: '#cbd5e1' },
  carie: { bg: '#ef4444', text: '#ffffff', label: 'Cárie Ativa', border: '#b91c1c' },
  restauracao_resina: { bg: '#3b82f6', text: '#ffffff', label: 'Restauração Resina', border: '#1d4ed8' },
  restauracao_amalgama: { bg: '#64748b', text: '#ffffff', label: 'Restauração Amálgama', border: '#334155' },
  tratamento_canal: { bg: '#8b5cf6', text: '#ffffff', label: 'Canal (Endodontia)', border: '#6d28d9' },
  coroa_protese: { bg: '#f59e0b', text: '#ffffff', label: 'Coroa / Prótese', border: '#b45309' },
  exodontia_indicada: { bg: '#e11d48', text: '#ffffff', label: 'Exodontia Indicada', border: '#9f1239' },
  ausente: { bg: '#e2e8f0', text: '#94a3b8', label: 'Ausente / Extraído', border: '#94a3b8' },
  implante: { bg: '#06b6d4', text: '#ffffff', label: 'Implante Dentário', border: '#0e7490' },
  selante: { bg: '#10b981', text: '#ffffff', label: 'Selante Preventivo', border: '#047857' },
  fratura: { bg: '#ea580c', text: '#ffffff', label: 'Fratura Coronária', border: '#c2410c' }
};

// Permanent teeth arrays
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// Deciduous teeth arrays
const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51];
const DECIDUOUS_UPPER_LEFT = [61, 62, 63, 64, 65];
const DECIDUOUS_LOWER_RIGHT = [85, 84, 83, 82, 81];
const DECIDUOUS_LOWER_LEFT = [71, 72, 73, 74, 75];

export const Odontogram: React.FC<OdontogramProps> = ({ odontogram, onToothUpdate, readOnly = false }) => {
  const [isDeciduous, setIsDeciduous] = useState(false);
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface>('O');
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('carie');
  const [toothNotes, setToothNotes] = useState<string>('');

  const currentToothData = activeTooth ? odontogram[activeTooth] || { toothNumber: activeTooth, conditions: [] } : null;

  const handleOpenToothModal = (toothNum: number) => {
    if (readOnly) return;
    setActiveTooth(toothNum);
    const existing = odontogram[toothNum];
    setToothNotes(existing?.notes || '');
  };

  const handleSaveCondition = () => {
    if (!activeTooth || !onToothUpdate) return;
    const existing = odontogram[activeTooth] || { toothNumber: activeTooth, conditions: [] };
    
    // Check if surface already has a condition
    const otherConditions = existing.conditions.filter(c => c.surface !== selectedSurface);
    const newConditions = [
      ...otherConditions,
      { surface: selectedSurface, condition: selectedCondition }
    ];

    const updatedData: ToothData = {
      toothNumber: activeTooth,
      conditions: newConditions,
      notes: toothNotes
    };

    onToothUpdate(activeTooth, updatedData);
    setActiveTooth(null);
  };

  const handleSetGeneralCondition = (cond: ToothCondition) => {
    if (!activeTooth || !onToothUpdate) return;
    const updatedData: ToothData = {
      toothNumber: activeTooth,
      conditions: [
        { surface: 'G', condition: cond }
      ],
      generalCondition: cond,
      notes: toothNotes
    };
    onToothUpdate(activeTooth, updatedData);
    setActiveTooth(null);
  };

  const handleClearTooth = () => {
    if (!activeTooth || !onToothUpdate) return;
    onToothUpdate(activeTooth, { toothNumber: activeTooth, conditions: [], notes: '' });
    setActiveTooth(null);
  };

  const getSurfaceColor = (toothNum: number, surface: ToothSurface): string => {
    const data = odontogram[toothNum];
    if (!data) return 'transparent';

    // General condition overrides
    if (data.generalCondition) {
      return CONDITION_COLORS[data.generalCondition]?.bg || 'transparent';
    }

    const matched = data.conditions.find(c => c.surface === surface);
    if (matched) {
      return CONDITION_COLORS[matched.condition]?.bg || 'transparent';
    }

    // Check general
    const general = data.conditions.find(c => c.surface === 'G');
    if (general) {
      return CONDITION_COLORS[general.condition]?.bg || 'transparent';
    }

    return 'transparent';
  };

  const isToothAffected = (toothNum: number): boolean => {
    const data = odontogram[toothNum];
    return !!data && (data.conditions.length > 0 || !!data.generalCondition || !!data.notes);
  };

  const renderToothSVG = (toothNum: number) => {
    const isAffected = isToothAffected(toothNum);
    const data = odontogram[toothNum];
    const isAusente = data?.generalCondition === 'ausente' || data?.conditions.some(c => c.condition === 'ausente');
    const isExo = data?.generalCondition === 'exodontia_indicada' || data?.conditions.some(c => c.condition === 'exodontia_indicada');
    const isImplante = data?.generalCondition === 'implante' || data?.conditions.some(c => c.condition === 'implante');
    const isCanal = data?.generalCondition === 'tratamento_canal' || data?.conditions.some(c => c.condition === 'tratamento_canal');

    const oclusalColor = getSurfaceColor(toothNum, 'O');
    const vestibularColor = getSurfaceColor(toothNum, 'V');
    const lingualColor = getSurfaceColor(toothNum, 'L');
    const mesialColor = getSurfaceColor(toothNum, 'M');
    const distalColor = getSurfaceColor(toothNum, 'D');

    return (
      <div 
        key={toothNum}
        id={`tooth-${toothNum}`}
        onClick={() => handleOpenToothModal(toothNum)}
        className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer select-none group ${
          readOnly ? '' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95'
        } ${isAffected ? 'ring-2 ring-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}
        title={`Dente ${toothNum}${data?.notes ? ` - ${data.notes}` : ''}`}
      >
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
          {toothNum}
        </span>

        {/* 2D 5-Surface Anatomical Dental Representation */}
        <div className="relative w-9 h-9 my-1 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            {/* Background base */}
            <rect x="5" y="5" width="90" height="90" rx="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" className="dark:fill-slate-800 dark:stroke-slate-600" />
            
            {/* Vestibular (Top) */}
            <polygon 
              points="10,10 90,10 70,30 30,30" 
              fill={vestibularColor !== 'transparent' ? vestibularColor : 'transparent'} 
              stroke="#64748b" 
              strokeWidth="1.5"
              className="transition-colors"
            />
            {/* Lingual/Palatina (Bottom) */}
            <polygon 
              points="30,70 70,70 90,90 10,90" 
              fill={lingualColor !== 'transparent' ? lingualColor : 'transparent'} 
              stroke="#64748b" 
              strokeWidth="1.5"
              className="transition-colors"
            />
            {/* Mesial (Left) */}
            <polygon 
              points="10,10 30,30 30,70 10,90" 
              fill={mesialColor !== 'transparent' ? mesialColor : 'transparent'} 
              stroke="#64748b" 
              strokeWidth="1.5"
              className="transition-colors"
            />
            {/* Distal (Right) */}
            <polygon 
              points="90,10 90,90 70,70 70,30" 
              fill={distalColor !== 'transparent' ? distalColor : 'transparent'} 
              stroke="#64748b" 
              strokeWidth="1.5"
              className="transition-colors"
            />
            {/* Oclusal / Incisal (Center) */}
            <polygon 
              points="30,30 70,30 70,70 30,70" 
              fill={oclusalColor !== 'transparent' ? oclusalColor : 'transparent'} 
              stroke="#475569" 
              strokeWidth="2"
              className="transition-colors"
            />

            {/* Special Overlays */}
            {isCanal && (
              <line x1="50" y1="12" x2="50" y2="88" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" />
            )}
            {isExo && (
              <>
                <line x1="15" y1="15" x2="85" y2="85" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
                <line x1="85" y1="15" x2="15" y2="85" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" />
              </>
            )}
            {isAusente && (
              <>
                <line x1="10" y1="10" x2="90" y2="90" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,4" />
                <line x1="90" y1="10" x2="10" y2="90" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,4" />
              </>
            )}
            {isImplante && (
              <circle cx="50" cy="50" r="28" fill="none" stroke="#06b6d4" strokeWidth="5" strokeDasharray="4,3" />
            )}
          </svg>
        </div>

        {/* Small badge if notes exist */}
        {data?.notes ? (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" title={data.notes} />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-6 shadow-xs">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Odontograma Anatômico Interativo (FDI)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {readOnly ? 'Visualização do mapa dental' : 'Clique em qualquer elemento para marcar faces (O, M, D, V, L/P) e patologias'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex text-xs font-medium">
            <button
              type="button"
              onClick={() => setIsDeciduous(false)}
              className={`px-3 py-1 rounded-lg transition-all ${
                !isDeciduous 
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Permanentes (32)
            </button>
            <button
              type="button"
              onClick={() => setIsDeciduous(true)}
              className={`px-3 py-1 rounded-lg transition-all ${
                isDeciduous 
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Decíduos / Infantil (20)
            </button>
          </div>
        </div>
      </div>

      {/* Dental Arches Grid */}
      <div className="py-6 overflow-x-auto">
        <div className="min-w-[620px] max-w-4xl mx-auto flex flex-col gap-6">
          {/* Upper Arch */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Quadrante Superior Direito (Vestibular)</span>
              <span>Arcada Superior (Maxila)</span>
              <span>Quadrante Superior Esquerdo</span>
            </div>

            <div className="flex items-center justify-center gap-1 md:gap-2">
              {/* Upper Right */}
              <div className="flex items-center gap-1 md:gap-1.5 justify-end flex-1">
                {(isDeciduous ? DECIDUOUS_UPPER_RIGHT : UPPER_RIGHT).map(renderToothSVG)}
              </div>

              {/* Midline divider */}
              <div className="h-16 w-0.5 bg-emerald-500/40 rounded-full mx-1" title="Linha Média Dental" />

              {/* Upper Left */}
              <div className="flex items-center gap-1 md:gap-1.5 justify-start flex-1">
                {(isDeciduous ? DECIDUOUS_UPPER_LEFT : UPPER_LEFT).map(renderToothSVG)}
              </div>
            </div>
          </div>

          {/* Lower Arch */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Quadrante Inferior Direito</span>
              <span>Arcada Inferior (Mandíbula)</span>
              <span>Quadrante Inferior Esquerdo</span>
            </div>

            <div className="flex items-center justify-center gap-1 md:gap-2">
              {/* Lower Right */}
              <div className="flex items-center gap-1 md:gap-1.5 justify-end flex-1">
                {(isDeciduous ? DECIDUOUS_LOWER_RIGHT : LOWER_RIGHT).map(renderToothSVG)}
              </div>

              {/* Midline divider */}
              <div className="h-16 w-0.5 bg-emerald-500/40 rounded-full mx-1" title="Linha Média Dental" />

              {/* Lower Left */}
              <div className="flex items-center gap-1 md:gap-1.5 justify-start flex-1">
                {(isDeciduous ? DECIDUOUS_LOWER_LEFT : LOWER_LEFT).map(renderToothSVG)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de cores padronizadas */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          Legenda de Cores & Convenções Odontológicas:
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cárie Ativa
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Resina Composta
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Amálgama
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Canal (Endo)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Prótese / Coroa
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Exodontia
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Implante
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Selante
          </span>
        </div>
      </div>

      {/* Tooth Detail & Edit Modal */}
      {activeTooth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
                  {activeTooth}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Anotar Dente {activeTooth}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecione a face ou a condição geral do elemento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooth(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Surface Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Face Dental a Ser Marcada:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { key: 'O', label: 'Oclusal (O)' },
                    { key: 'M', label: 'Mesial (M)' },
                    { key: 'D', label: 'Distal (D)' },
                    { key: 'V', label: 'Vestibular (V)' },
                    { key: 'L', label: 'Lingual (L)' },
                    { key: 'P', label: 'Palatina (P)' }
                  ].map(surf => (
                    <button
                      key={surf.key}
                      type="button"
                      onClick={() => setSelectedSurface(surf.key as ToothSurface)}
                      className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all ${
                        selectedSurface === surf.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {surf.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Picker for Selected Surface */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Diagnóstico / Material para Face [{selectedSurface}]:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'carie', label: 'Cárie Ativa', color: 'bg-red-500 text-white' },
                    { key: 'restauracao_resina', label: 'Resina Composta', color: 'bg-blue-500 text-white' },
                    { key: 'restauracao_amalgama', label: 'Amálgama', color: 'bg-slate-600 text-white' },
                    { key: 'selante', label: 'Selante', color: 'bg-emerald-500 text-white' },
                    { key: 'fratura', label: 'Fratura de Face', color: 'bg-orange-500 text-white' }
                  ].map(cond => (
                    <button
                      key={cond.key}
                      type="button"
                      onClick={() => setSelectedCondition(cond.key as ToothCondition)}
                      className={`p-2.5 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedCondition === cond.key
                          ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-slate-800 dark:text-slate-200">{cond.label}</span>
                      <span className={`w-3 h-3 rounded-full ${cond.color}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions (General Tooth Condition) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Condições Globais do Elemento:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('tratamento_canal')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                  >
                    Tratamento de Canal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('coroa_protese')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                  >
                    Coroa / Prótese Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('exodontia_indicada')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                  >
                    Exodontia Indicada
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('ausente')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  >
                    Elemento Ausente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('implante')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100"
                  >
                    Implante Ósseo
                  </button>
                </div>
              </div>

              {/* Notes for this tooth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Clínicas / Conduta Proposta:
                </label>
                <input
                  type="text"
                  value={toothNotes}
                  onChange={(e) => setToothNotes(e.target.value)}
                  placeholder="Ex: Restauração Classe II MO, teste de sensibilidade positivo..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Currently applied conditions */}
              {currentToothData && currentToothData.conditions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                    Registros atuais deste dente:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentToothData.conditions.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                      >
                        Face [{c.surface}]: {CONDITION_COLORS[c.condition]?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClearTooth}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpar Dente
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTooth(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCondition}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Salvar Face [{selectedSurface}]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
