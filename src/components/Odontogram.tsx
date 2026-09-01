import React, { useState, useEffect } from 'react';
import { ToothData, ToothCondition, ToothSurface } from '../types';
import { Sparkles, Info, RotateCcw, X, Plus, Eye, Layers, ChevronRight, Smartphone, RotateCw } from 'lucide-react';

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
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

// Deciduous teeth arrays
const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51];
const DECIDUOUS_UPPER_LEFT = [61, 62, 63, 64, 65];
const DECIDUOUS_LOWER_LEFT = [71, 72, 73, 74, 75];
const DECIDUOUS_LOWER_RIGHT = [85, 84, 83, 82, 81];

const TOOTH_NAMES: Record<number, string> = {
  18: '3º Molar Sup. Dir.', 17: '2º Molar Sup. Dir.', 16: '1º Molar Sup. Dir.', 15: '2º Pré-Molar Sup. Dir.', 14: '1º Pré-Molar Sup. Dir.', 13: 'Canino Sup. Dir.', 12: 'Inc. Lateral Sup. Dir.', 11: 'Inc. Central Sup. Dir.',
  21: 'Inc. Central Sup. Esq.', 22: 'Inc. Lateral Sup. Esq.', 23: 'Canino Sup. Esq.', 24: '1º Pré-Molar Sup. Esq.', 25: '2º Pré-Molar Sup. Esq.', 26: '1º Molar Sup. Esq.', 27: '2º Molar Sup. Esq.', 28: '3º Molar Sup. Esq.',
  31: 'Inc. Central Inf. Esq.', 32: 'Inc. Lateral Inf. Esq.', 33: 'Canino Inf. Esq.', 34: '1º Pré-Molar Inf. Esq.', 35: '2º Pré-Molar Inf. Esq.', 36: '1º Molar Inf. Esq.', 37: '2º Molar Inf. Esq.', 38: '3º Molar Inf. Esq.',
  41: 'Inc. Central Inf. Dir.', 42: 'Inc. Lateral Inf. Dir.', 43: 'Canino Inf. Dir.', 44: '1º Pré-Molar Inf. Dir.', 45: '2º Pré-Molar Inf. Dir.', 46: '1º Molar Inf. Dir.', 47: '2º Molar Inf. Dir.', 48: '3º Molar Inf. Dir.',
  55: '2º Molar Dec. Sup. Dir.', 54: '1º Molar Dec. Sup. Dir.', 53: 'Canino Dec. Sup. Dir.', 52: 'Inc. Lateral Dec. Sup. Dir.', 51: 'Inc. Central Dec. Sup. Dir.',
  61: 'Inc. Central Dec. Sup. Esq.', 62: 'Inc. Lateral Dec. Sup. Esq.', 63: 'Canino Dec. Sup. Esq.', 64: '1º Molar Dec. Sup. Esq.', 65: '2º Molar Dec. Sup. Esq.',
  71: 'Inc. Central Dec. Inf. Esq.', 72: 'Inc. Lateral Dec. Inf. Esq.', 73: 'Canino Dec. Inf. Esq.', 74: '1º Molar Dec. Inf. Esq.', 75: '2º Molar Dec. Inf. Esq.',
  81: 'Inc. Central Dec. Inf. Dir.', 82: 'Inc. Lateral Dec. Inf. Dir.', 83: 'Canino Dec. Inf. Dir.', 84: '1º Molar Dec. Inf. Dir.', 85: '2º Molar Dec. Inf. Dir.'
};

export const Odontogram: React.FC<OdontogramProps> = ({ odontogram, onToothUpdate, readOnly = false }) => {
  const [isDeciduous, setIsDeciduous] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface>('O');
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('carie');
  const [toothNotes, setToothNotes] = useState<string>('');
  
  const [viewMode, setViewMode] = useState<'fit' | 'zoom'>('fit');
  
  // Screen orientation state
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [dismissedRotateBanner, setDismissedRotateBanner] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isMobileScreen = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        setIsPortraitMobile(isMobileScreen && isPortrait);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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

  const renderToothSVG = (toothNum: number, customSizeClass?: string) => {
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

    const sizeClass = customSizeClass || (
      viewMode === 'fit' 
        ? 'w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10' 
        : 'w-8 h-8 sm:w-11 sm:h-11'
    );

    return (
      <div 
        key={toothNum}
        id={`tooth-${toothNum}`}
        onClick={() => handleOpenToothModal(toothNum)}
        className={`flex flex-col items-center justify-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl transition-all cursor-pointer select-none group shrink-0 ${
          readOnly ? '' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:scale-105 active:scale-95'
        } ${isAffected ? 'ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-800/60'}`}
        title={`Dente ${toothNum} (${TOOTH_NAMES[toothNum] || ''})${data?.notes ? ` - ${data.notes}` : ''}`}
      >
        <span className="text-[8px] xs:text-[9px] sm:text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-none">
          {toothNum}
        </span>

        {/* 2D 5-Surface Anatomical Dental Representation */}
        <div className={`relative ${sizeClass} my-0.5 flex items-center justify-center`}>
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
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5 shadow-xs" title={data.notes} />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
        )}
      </div>
    );
  };

  // Quadrants definition
  const quadrants = isDeciduous
    ? [
        { id: 'Q5', label: 'Q5 - Sup. Dir.', title: 'Quadrante 5: Superior Direito Decíduo', teeth: DECIDUOUS_UPPER_RIGHT },
        { id: 'Q6', label: 'Q6 - Sup. Esq.', title: 'Quadrante 6: Superior Esquerdo Decíduo', teeth: DECIDUOUS_UPPER_LEFT },
        { id: 'Q7', label: 'Q7 - Inf. Esq.', title: 'Quadrante 7: Inferior Esquerdo Decíduo', teeth: DECIDUOUS_LOWER_LEFT },
        { id: 'Q8', label: 'Q8 - Inf. Dir.', title: 'Quadrante 8: Inferior Direito Decíduo', teeth: DECIDUOUS_LOWER_RIGHT },
      ]
    : [
        { id: 'Q1', label: 'Q1 (18-11) Sup. Dir.', title: 'Quadrante 1: Superior Direito (Maxila)', teeth: UPPER_RIGHT },
        { id: 'Q2', label: 'Q2 (21-28) Sup. Esq.', title: 'Quadrante 2: Superior Esquerdo (Maxila)', teeth: UPPER_LEFT },
        { id: 'Q3', label: 'Q3 (31-38) Inf. Esq.', title: 'Quadrante 3: Inferior Esquerdo (Mandíbula)', teeth: LOWER_LEFT },
        { id: 'Q4', label: 'Q4 (48-41) Inf. Dir.', title: 'Quadrante 4: Inferior Direito (Mandíbula)', teeth: LOWER_RIGHT },
      ];

  const activeQuadrantData = quadrants.find(q => q.id === selectedQuadrant);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-3 sm:p-5 md:p-6 shadow-xs space-y-3 sm:space-y-4">
      {/* Mobile Orientation Advice Banner (when in portrait on smartphone) */}
      {isPortraitMobile && !dismissedRotateBanner && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <RotateCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                <span>Vire a tela do celular na horizontal (Paisagem)</span>
              </h4>
              <p className="text-[11px] text-emerald-50 leading-tight">
                Para visualizar todos os 32 dentes simultaneamente e todas as informações sem cortes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissedRotateBanner(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 text-xs font-bold"
            title="Entendi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Odontograma Anatômico Interativo (FDI)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {readOnly ? 'Visualização completa do mapa dental' : 'Toque em qualquer dente para anotar faces (O, M, D, V, L/P)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode (Fit to screen vs Zoom) */}
          <div className="bg-[#F3F7F5]/80 dark:bg-slate-800 p-1 rounded-xl flex text-xs font-semibold border border-emerald-100/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('fit')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
                viewMode === 'fit'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Ajustar todos os dentes na tela"
            >
              Ajustar (Todos)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('zoom')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
                viewMode === 'zoom'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Aumentar dentes com rolagem"
            >
              Zoom +
            </button>
          </div>

          {/* Dentition type (Permanente vs Decíduo) */}
          <div className="bg-[#F3F7F5]/80 dark:bg-slate-800 p-1 rounded-xl flex text-xs font-semibold border border-emerald-100/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsDeciduous(false);
                setSelectedQuadrant('all');
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all text-xs ${
                !isDeciduous 
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Permanentes (32)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDeciduous(true);
                setSelectedQuadrant('all');
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all text-xs ${
                isDeciduous 
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Decíduos (20)
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Desktop Quadrant Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedQuadrant('all')}
          className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedQuadrant === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/50 dark:shadow-none'
              : 'bg-[#F3F7F5]/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-emerald-100/60 dark:border-slate-700 hover:border-emerald-500'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Visão Geral (Todos os 32 Dentes: 18 ao 48)
        </button>

        {quadrants.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setSelectedQuadrant(q.id)}
            className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedQuadrant === q.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/50 dark:shadow-none'
                : 'bg-[#F3F7F5]/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-emerald-100/60 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Quadrant Zoom / Mobile Specific Grid View */}
      {selectedQuadrant !== 'all' && activeQuadrantData ? (
        <div className="bg-[#F3F7F5]/40 dark:bg-slate-800/30 p-3 sm:p-5 rounded-2xl border border-emerald-100/80 dark:border-slate-800 space-y-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {activeQuadrantData.title}
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              {activeQuadrantData.teeth.length} Dentes no quadrante
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {activeQuadrantData.teeth.map((tNum) => {
              const data = odontogram[tNum];
              const affected = isToothAffected(tNum);
              return (
                <div
                  key={tNum}
                  onClick={() => handleOpenToothModal(tNum)}
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center justify-between ${
                    affected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                      #{tNum}
                    </span>
                    {data?.generalCondition ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {CONDITION_COLORS[data.generalCondition]?.label.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {data?.conditions.length ? `${data.conditions.length} face(s)` : 'Hígido'}
                      </span>
                    )}
                  </div>

                  <div className="my-1.5">
                    {renderToothSVG(tNum, 'w-11 h-11 sm:w-14 sm:h-14')}
                  </div>

                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {TOOTH_NAMES[tNum] || `Dente ${tNum}`}
                  </p>

                  <button
                    type="button"
                    className="mt-2 w-full py-1 text-[10px] sm:text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Anotar Dente
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Dental Arches Grid - All 32 teeth guaranteed visible without left-side clipping */
        <div className="py-2 overflow-x-auto w-full">
          <div className="min-w-fit w-max mx-auto px-1 sm:px-2 flex flex-col gap-3 sm:gap-4">
            {/* Upper Arch (18 to 28) */}
            <div className="bg-[#F3F7F5]/50 dark:bg-slate-800/40 p-2 sm:p-3.5 rounded-2xl border border-emerald-100/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5 px-2 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="text-emerald-800 dark:text-emerald-300 font-extrabold">Q1: Sup. Direito (18 ao 11)</span>
                <span className="text-slate-900 dark:text-slate-100 font-black">Arcada Superior (Maxila)</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-extrabold">Q2: Sup. Esquerdo (21 ao 28)</span>
              </div>

              <div className="flex items-center justify-start sm:justify-center gap-0.5 sm:gap-1 py-1">
                {/* Upper Right: 18, 17, 16, 15, 14, 13, 12, 11 */}
                <div className="flex items-center gap-0.5 sm:gap-1 justify-end shrink-0">
                  {(isDeciduous ? DECIDUOUS_UPPER_RIGHT : UPPER_RIGHT).map((t) => renderToothSVG(t))}
                </div>

                {/* Midline divider */}
                <div className="h-10 sm:h-14 w-0.5 bg-emerald-500/80 rounded-full mx-0.5 sm:mx-1 shrink-0" title="Linha Média Dental" />

                {/* Upper Left: 21, 22, 23, 24, 25, 26, 27, 28 */}
                <div className="flex items-center gap-0.5 sm:gap-1 justify-start shrink-0">
                  {(isDeciduous ? DECIDUOUS_UPPER_LEFT : UPPER_LEFT).map((t) => renderToothSVG(t))}
                </div>
              </div>
            </div>

            {/* Lower Arch (48 to 38) */}
            <div className="bg-[#F3F7F5]/50 dark:bg-slate-800/40 p-2 sm:p-3.5 rounded-2xl border border-emerald-100/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5 px-2 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="text-emerald-800 dark:text-emerald-300 font-extrabold">Q4: Inf. Direito (48 ao 41)</span>
                <span className="text-slate-900 dark:text-slate-100 font-black">Arcada Inferior (Mandíbula)</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-extrabold">Q3: Inf. Esquerdo (31 ao 38)</span>
              </div>

              <div className="flex items-center justify-start sm:justify-center gap-0.5 sm:gap-1 py-1">
                {/* Lower Right: 48, 47, 46, 45, 44, 43, 42, 41 */}
                <div className="flex items-center gap-0.5 sm:gap-1 justify-end shrink-0">
                  {(isDeciduous ? DECIDUOUS_LOWER_RIGHT : LOWER_RIGHT).map((t) => renderToothSVG(t))}
                </div>

                {/* Midline divider */}
                <div className="h-10 sm:h-14 w-0.5 bg-emerald-500/80 rounded-full mx-0.5 sm:mx-1 shrink-0" title="Linha Média Dental" />

                {/* Lower Left: 31, 32, 33, 34, 35, 36, 37, 38 */}
                <div className="flex items-center gap-0.5 sm:gap-1 justify-start shrink-0">
                  {(isDeciduous ? DECIDUOUS_LOWER_LEFT : LOWER_LEFT).map((t) => renderToothSVG(t))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legenda de cores padronizadas */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  {activeTooth}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {TOOTH_NAMES[activeTooth] || `Elemento Dental ${activeTooth}`}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Selecione a face ou condição geral a ser registrada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooth(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Tooth Visual Preview */}
              <div className="flex items-center justify-center bg-[#F3F7F5]/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-emerald-100/60 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  {renderToothSVG(activeTooth, 'w-16 h-16')}
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Visualização do Elemento</span>
                    <span className="text-[11px] text-slate-500">Faces: V (Superior), L/P (Inferior), M (Esquerda), D (Direita), O (Centro)</span>
                  </div>
                </div>
              </div>

              {/* Surface Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Face Dental a Ser Marcada:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                        selectedSurface === surf.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200/50'
                          : 'bg-[#F3F7F5]/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-emerald-100/80 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {surf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Picker for Selected Surface */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Diagnóstico / Material para Face [{selectedSurface}]:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'carie', label: 'Cárie Ativa', color: 'bg-red-500' },
                    { key: 'restauracao_resina', label: 'Resina Composta', color: 'bg-blue-500' },
                    { key: 'restauracao_amalgama', label: 'Amálgama', color: 'bg-slate-600' },
                    { key: 'selante', label: 'Selante Preventivo', color: 'bg-emerald-500' },
                    { key: 'fratura', label: 'Fratura de Face', color: 'bg-orange-500' }
                  ].map(cond => (
                    <button
                      key={cond.key}
                      type="button"
                      onClick={() => setSelectedCondition(cond.key as ToothCondition)}
                      className={`p-2.5 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedCondition === cond.key
                          ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-slate-800 dark:text-slate-200">{cond.label}</span>
                      <span className={`w-3.5 h-3.5 rounded-full ${cond.color} shadow-xs`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions (General Tooth Condition) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Condições Globais do Elemento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('tratamento_canal')}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-center"
                  >
                    Canal (Endo)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('coroa_protese')}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-center"
                  >
                    Coroa / Prótese
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('exodontia_indicada')}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-center"
                  >
                    Exodontia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('ausente')}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 text-center"
                  >
                    Elemento Ausente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGeneralCondition('implante')}
                    className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 text-center"
                  >
                    Implante Ósseo
                  </button>
                </div>
              </div>

              {/* Notes for this tooth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Clínicas / Conduta Proposta:
                </label>
                <input
                  type="text"
                  value={toothNotes}
                  onChange={(e) => setToothNotes(e.target.value)}
                  placeholder="Ex: Restauração Classe II MO, teste de sensibilidade positivo..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Currently applied conditions */}
              {currentToothData && currentToothData.conditions.length > 0 && (
                <div className="bg-[#F3F7F5]/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-emerald-100/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Registros atuais deste dente:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentToothData.conditions.map((c, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                      >
                        Face [{c.surface}]: {CONDITION_COLORS[c.condition]?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleClearTooth}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Limpar Dente
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTooth(null)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCondition}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200/50 flex items-center gap-1.5"
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
