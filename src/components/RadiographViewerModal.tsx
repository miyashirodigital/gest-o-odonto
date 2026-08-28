import React, { useState } from 'react';
import { RadiographExam } from '../types';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Sun, 
  Contrast, 
  Eye, 
  Download, 
  Calendar, 
  Tag, 
  Sliders, 
  Maximize2 
} from 'lucide-react';

interface RadiographViewerModalProps {
  exam: RadiographExam;
  allExams?: RadiographExam[];
  onClose: () => void;
}

export const RadiographViewerModal: React.FC<RadiographViewerModalProps> = ({ exam, allExams = [], onClose }) => {
  const [currentExam, setCurrentExam] = useState<RadiographExam>(exam);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [compareExamId, setCompareExamId] = useState<string | null>(null);

  const compareExam = allExams.find(e => e.id === compareExamId);

  const resetFilters = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setIsInverted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {currentExam.type}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {currentExam.title}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(currentExam.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                {currentExam.teethReferenced && (
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    • Dentes: <strong className="text-emerald-400">{currentExam.teethReferenced}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allExams.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span>Comparar:</span>
                <select
                  value={compareExamId || ''}
                  onChange={(e) => setCompareExamId(e.target.value || null)}
                  className="bg-transparent text-emerald-400 font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="" className="bg-slate-800 text-white">Nenhum (Vista Única)</option>
                  {allExams.filter(e => e.id !== currentExam.id).map(e => (
                    <option key={e.id} value={e.id} className="bg-slate-800 text-white">
                      {e.title} ({new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Radiology Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-400">{Math.round(zoom * 100)}%</span>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
              title="Girar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsInverted(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                isInverted ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Inverter filme radiográfico (Modo Negativo)"
            >
              <Eye className="w-4 h-4" /> Negativo X-Ray
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Restaurar
            </button>
          </div>

          {/* Sliders for Brightness and Contrast */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">Brilho:</span>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-20 sm:w-28 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Contrast className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400">Contraste:</span>
              <input
                type="range"
                min="50"
                max="250"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-20 sm:w-28 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Main Canvas Viewport (Single or Side-by-Side Comparison) */}
        <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-black/80">
          {/* Main Image Stage */}
          <div className="flex-1 h-full overflow-auto flex items-center justify-center p-4 relative select-none">
            <img
              src={currentExam.imageUrl}
              alt={currentExam.title}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(1) hue-rotate(180deg)' : ''}`,
                transition: 'transform 0.15s ease-out, filter 0.1s ease-out'
              }}
              className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
            />
          </div>

          {/* Comparison Image Stage if enabled */}
          {compareExam && (
            <div className="flex-1 h-full overflow-auto flex flex-col items-center justify-center p-4 relative border-t md:border-t-0 md:border-l border-slate-800 bg-black/90">
              <div className="absolute top-3 left-4 z-10 bg-slate-900/80 px-3 py-1 rounded-lg text-xs text-amber-300 font-semibold border border-amber-500/30">
                Comparativo: {compareExam.title} ({new Date(compareExam.date + 'T12:00:00').toLocaleDateString('pt-BR')})
              </div>
              <img
                src={compareExam.imageUrl}
                alt={compareExam.title}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(1) hue-rotate(180deg)' : ''}`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
              />
            </div>
          )}

          {/* Right/Bottom Diagnostic Report Drawer */}
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-5 overflow-y-auto shrink-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Laudo & Interpretação Radiográfica
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  {currentExam.notes || 'Sem laudo radiográfico detalhado registrado.'}
                </p>
              </div>

              {currentExam.diagnosis && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Hipótese Diagnóstica / Conclusão
                  </h4>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs font-medium">
                    {currentExam.diagnosis}
                  </div>
                </div>
              )}

              {currentExam.tags && currentExam.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags do Exame
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentExam.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Switcher if multiple exams */}
            {allExams.length > 1 && (
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-2">
                  Outros exames deste paciente:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {allExams.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        setCurrentExam(ex);
                        resetFilters();
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        currentExam.id === ex.id ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
