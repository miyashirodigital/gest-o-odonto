import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudySubject, ExamSchedule } from '../types';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  GraduationCap, 
  Layers, 
  Search, 
  Play, 
  Pause, 
  RotateCcw, 
  FolderOpen, 
  FilePlus, 
  HelpCircle, 
  X, 
  CheckCheck,
  CalendarDays,
  AlertCircle
} from 'lucide-react';

export const StudyView: React.FC = () => {
  const { 
    studySubjects, 
    addStudySubject, 
    updateStudySubject, 
    deleteStudySubject, 
    addStudyTopic, 
    toggleStudyTopic, 
    deleteStudyTopic, 
    examSchedules, 
    addExamSchedule, 
    updateExamSchedule, 
    deleteExamSchedule, 
    showToast 
  } = useApp();

  // Modals state
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<ExamSchedule | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<StudySubject | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamSchedule | null>(null);

  // Active Subject Selection & Filter
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examFilter, setExamFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  // Quick Topic input state per subject
  const [newTopicTitles, setNewTopicTitles] = useState<Record<string, string>>({});
  const [newTopicPriorities, setNewTopicPriorities] = useState<Record<string, 'baixa' | 'media' | 'alta'>>({});
  const [newTopicDocs, setNewTopicDocs] = useState<Record<string, string>>({});

  // Subject Form State
  const [subjName, setSubjName] = useState<string>('');
  const [subjColor, setSubjColor] = useState<string>('#10b981');
  const [subjProfessor, setSubjProfessor] = useState<string>('');
  const [subjDriveUrl, setSubjDriveUrl] = useState<string>('');
  const [subjDocsUrl, setSubjDocsUrl] = useState<string>('');

  // Exam Form State (No room, no target grade)
  const [examSubject, setExamSubject] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [examTime, setExamTime] = useState<string>('08:00');
  const [examTopics, setExamTopics] = useState<string>('');

  // Pomodoro Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState<number>(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState<boolean>(false);
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');
  const [showPomodoroInfo, setShowPomodoroInfo] = useState<boolean>(false);
  const [pomodoroCompletionMsg, setPomodoroCompletionMsg] = useState<string | null>(null);

  React.useEffect(() => {
    let interval: any = null;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds(prev => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      if (pomodoroMode === 'study') {
        const message = 'Bom trabalho! Agora faça uma pausa de 5 minutos e retorne para mais uma sessão.';
        showToast(message, 'success');
        setPomodoroCompletionMsg(message);
        setPomodoroMode('break');
        setPomodoroSeconds(5 * 60);
      } else {
        const message = 'Pausa concluída! Pronto para retornar a mais uma sessão de foco.';
        showToast(message, 'info');
        setPomodoroCompletionMsg(message);
        setPomodoroMode('study');
        setPomodoroSeconds(25 * 60);
      }
      setPomodoroRunning(false);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSeconds, pomodoroMode, showToast]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper for day countdown
  const getDaysUntilExam = (dateStr: string) => {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examD = new Date(dateStr + 'T00:00:00');
    const diffTime = examD.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Real-time calculation of Next Upcoming Exam (uncompleted, sorted by date ascending)
  const upcomingExams = [...examSchedules]
    .filter(e => !e.completed)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  const nextExam = upcomingExams[0] || null;

  // Filtered exams for the dedicated exams section
  const displayedExams = [...examSchedules]
    .filter(e => {
      if (examFilter === 'upcoming') return !e.completed;
      if (examFilter === 'completed') return e.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    });

  // Handle open Subject modal for create / edit
  const handleOpenSubjectModal = (subj?: StudySubject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjName(subj.name);
      setSubjColor(subj.color || '#10b981');
      setSubjProfessor(subj.professor || '');
      setSubjDriveUrl(subj.driveFolderUrl || '');
      setSubjDocsUrl(subj.googleDocsUrl || '');
    } else {
      setEditingSubject(null);
      setSubjName('');
      setSubjColor('#10b981');
      setSubjProfessor('');
      setSubjDriveUrl('');
      setSubjDocsUrl('');
    }
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim()) {
      showToast('Informe o nome da matéria.', 'warning');
      return;
    }

    if (editingSubject) {
      updateStudySubject(editingSubject.id, {
        name: subjName.trim(),
        color: subjColor,
        professor: subjProfessor.trim() || undefined,
        driveFolderUrl: subjDriveUrl.trim() || undefined,
        googleDocsUrl: subjDocsUrl.trim() || undefined
      });
    } else {
      addStudySubject({
        name: subjName.trim(),
        color: subjColor,
        professor: subjProfessor.trim() || undefined,
        driveFolderUrl: subjDriveUrl.trim() || undefined,
        googleDocsUrl: subjDocsUrl.trim() || undefined
      });
    }
    setShowSubjectModal(false);
  };

  const handleDeleteSubjectConfirmed = (id: string) => {
    deleteStudySubject(id);
    setSubjectToDelete(null);
    if (showSubjectModal) setShowSubjectModal(false);
  };

  // Handle open Exam modal
  const handleOpenExamModal = (exam?: ExamSchedule) => {
    if (exam) {
      setEditingExam(exam);
      setExamSubject(exam.subject);
      setExamDate(exam.examDate);
      setExamTime(exam.time || '08:00');
      setExamTopics(exam.topicsCovered || '');
    } else {
      setEditingExam(null);
      setExamSubject(studySubjects[0]?.name || '');
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setExamDate(nextWeek.toISOString().split('T')[0]);
      setExamTime('08:00');
      setExamTopics('');
    }
    setShowExamModal(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubject.trim() || !examDate) {
      showToast('Informe a matéria e data da prova.', 'warning');
      return;
    }

    if (editingExam) {
      updateExamSchedule(editingExam.id, {
        subject: examSubject.trim(),
        examDate,
        time: examTime,
        topicsCovered: examTopics.trim() || undefined
      });
    } else {
      addExamSchedule({
        subject: examSubject.trim(),
        examDate,
        time: examTime,
        topicsCovered: examTopics.trim() || undefined,
        completed: false
      });
    }
    setShowExamModal(false);
  };

  const handleDeleteExamConfirmed = (id: string) => {
    deleteExamSchedule(id);
    setExamToDelete(null);
    if (showExamModal) setShowExamModal(false);
  };

  // Quick topic adder
  const handleAddTopic = (subjectId: string) => {
    const title = newTopicTitles[subjectId]?.trim();
    if (!title) return;

    const priority = newTopicPriorities[subjectId] || 'media';
    const docLink = newTopicDocs[subjectId]?.trim() || undefined;

    addStudyTopic(subjectId, {
      title,
      completed: false,
      priority,
      docLink
    });

    setNewTopicTitles(prev => ({ ...prev, [subjectId]: '' }));
    setNewTopicDocs(prev => ({ ...prev, [subjectId]: '' }));
    showToast('Tema adicionado ao plano de estudos!');
  };

  // Filtered Subjects
  const filteredSubjects = studySubjects.filter(s => {
    if (selectedSubjectId !== 'all' && s.id !== selectedSubjectId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchTopic = s.topics.some(t => t.title.toLowerCase().includes(q));
      if (!matchName && !matchTopic) return false;
    }
    return true;
  });

  const totalTopics = studySubjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = studySubjects.reduce((acc, s) => acc + s.topics.filter(t => t.completed).length, 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner with Exam Countdown and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Next Exam Hero Banner */}
        <div className="lg:col-span-8 bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-emerald-700/40 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-emerald-100 backdrop-blur-xs flex items-center gap-1.5 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" /> Organização de Estudos & Provas
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenExamModal()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agendar Prova
                </button>
              </div>
            </div>

            {nextExam ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-300" /> Próxima Prova Agendada:
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {nextExam.subject}
                    </h2>
                  </div>

                  {/* Countdown Badge */}
                  {(() => {
                    const days = getDaysUntilExam(nextExam.examDate);
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xs ${
                          days <= 2
                            ? 'bg-rose-500 text-white animate-pulse'
                            : days <= 7
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-400 text-slate-950'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          {days === 0
                            ? 'Hoje!'
                            : days === 1
                            ? 'Amanhã!'
                            : days < 0
                            ? 'Data passada'
                            : `Faltam ${days} dias`}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[10px] font-bold">Data & Horário da Avaliação</span>
                    <strong className="text-white text-sm">
                      {new Date(nextExam.examDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {nextExam.time || '08:00'}
                    </strong>
                  </div>
                </div>

                {nextExam.topicsCovered && (
                  <p className="text-xs text-emerald-100/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                    <strong>Conteúdo cobrado:</strong> {nextExam.topicsCovered}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2.5 bg-white/5 rounded-2xl border border-white/10 p-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-bold text-[11px] mb-1">
                    Sem prova marcada
                  </span>
                  <h3 className="text-base font-bold text-white">Nenhuma avaliação agendada no momento</h3>
                  <p className="text-xs text-emerald-200/80 max-w-sm mx-auto mt-1">
                    Você não tem provas pendentes cadastradas. Clique no botão abaixo para adicionar a data da sua próxima prova teórica ou prática.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenExamModal()}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agendar Prova
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Study Pomodoro / Focus & Progress Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Método Pomodoro</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPomodoroInfo(prev => !prev)}
                  className="w-5 h-5 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                  title="O que é o Método Pomodoro? Clique para saber mais"
                  aria-label="Informações sobre o Método Pomodoro"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                pomodoroMode === 'study'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {pomodoroMode === 'study' ? 'Sessão Foco' : 'Intervalo'}
              </span>
            </div>

            {/* Explanatory Box for Pomodoro Method */}
            {showPomodoroInfo && (
              <div className="p-3 mb-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed space-y-1 relative animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" /> O que é o Método Pomodoro?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPomodoroInfo(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p>
                  O método Pomodoro é uma técnica de organização do tempo que consiste em estudar ou trabalhar por 25 minutos com total foco e, em seguida, fazer uma pausa de 5 minutos.
                </p>
              </div>
            )}

            {/* Timer Completion Alert Notification */}
            {pomodoroCompletionMsg && (
              <div className="p-3 mb-3 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-start justify-between gap-2 animate-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{pomodoroCompletionMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPomodoroCompletionMsg(null)}
                  className="p-0.5 text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 shrink-0 cursor-pointer"
                  title="Dispensar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="text-center py-2">
              <span className="text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {formatTimer(pomodoroSeconds)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setPomodoroRunning(!pomodoroRunning);
                  if (!pomodoroRunning) {
                    setPomodoroCompletionMsg(null);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-xs cursor-pointer ${
                  pomodoroRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {pomodoroRunning ? 'Pausar' : 'Iniciar Foco'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroSeconds(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
                  setPomodoroCompletionMsg(null);
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Reiniciar timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Overall Study Progress Bar */}
          <div className="pt-3 border-t border-emerald-100/60 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Progresso Geral de Estudos</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>{completedTopics} temas estudados</span>
              <span>{totalTopics} temas totais</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED EXAMS LIST SECTION (Cronograma de Provas & Avaliações) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Cronograma de Provas & Avaliações
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold">
                  {examSchedules.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize todas as suas provas agendadas, datas e marque as concluídas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setExamFilter('upcoming')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  examFilter === 'upcoming'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Próximas ({examSchedules.filter(e => !e.completed).length})
              </button>
              <button
                type="button"
                onClick={() => setExamFilter('completed')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  examFilter === 'completed'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Concluídas ({examSchedules.filter(e => e.completed).length})
              </button>
              <button
                type="button"
                onClick={() => setExamFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  examFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Todas ({examSchedules.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenExamModal()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nova Prova
            </button>
          </div>
        </div>

        {/* Exams List Grid */}
        {displayedExams.length === 0 ? (
          <div className="py-8 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {examFilter === 'completed'
                ? 'Nenhuma prova concluída ainda.'
                : examFilter === 'upcoming'
                ? 'Sem prova marcada no momento.'
                : 'Nenhuma prova cadastrada no cronograma.'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cadastre suas avaliações teóricas e práticas para manter o calendário sincronizado.
            </p>
            <button
              type="button"
              onClick={() => handleOpenExamModal()}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Prova
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedExams.map(exam => {
              const days = getDaysUntilExam(exam.examDate);
              const isPast = days < 0 && !exam.completed;

              return (
                <div
                  key={exam.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    exam.completed
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                      : 'bg-white dark:bg-slate-800/90 border-emerald-100 dark:border-slate-700 shadow-2xs hover:border-emerald-400'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header with subject & status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          Avaliação / Prova
                        </span>
                        <h4 className={`text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug ${exam.completed ? 'line-through text-slate-400' : ''}`}>
                          {exam.subject}
                        </h4>
                      </div>

                      {exam.completed ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                          <CheckCheck className="w-3 h-3" /> Realizada
                        </span>
                      ) : days === 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white animate-pulse shrink-0">
                          Hoje!
                        </span>
                      ) : days === 1 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400 text-slate-950 shrink-0">
                          Amanhã!
                        </span>
                      ) : isPast ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                          Data passada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          Em {days} dias
                        </span>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">
                          {new Date(exam.examDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {exam.time || '08:00'}
                        </span>
                      </div>
                    </div>

                    {/* Topics covered */}
                    {exam.topicsCovered && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-700 dark:text-slate-300">Conteúdo:</strong> {exam.topicsCovered}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => updateExamSchedule(exam.id, { completed: !exam.completed })}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                        exam.completed
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {exam.completed ? (
                        <>
                          <RotateCcw className="w-3 h-3" /> Reabrir
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Concluir Prova
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenExamModal(exam)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar prova"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamToDelete(exam)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Excluir prova"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Integration Hub (Direct Launchers for Google Drive & Google Docs) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Acesso Direto ao Google Drive & Google Docs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Abra os aplicativos diretamente com um clique para selecionar pastas de slides, atlas, artigos e cadernos de resumos
            </p>
          </div>
        </div>

        {/* Direct App Launchers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Drive Direct Hub */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-[#F3F7F5] to-emerald-50/30 dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Google Drive
                    </h4>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Pastas, PDFs, Slides e Atlas de Anatomia
                    </span>
                  </div>
                </div>

                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  Abrir Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                Acesse todo o seu armazenamento do Google para selecionar arquivos de aulas práticas, fotos clínicas e materiais da turma.
              </p>
            </div>
          </div>

          {/* Google Docs Direct Hub */}
          <div className="bg-gradient-to-br from-blue-50/70 via-[#F3F7F5] to-blue-50/30 dark:from-blue-950/30 dark:via-slate-800/60 dark:to-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Google Docs
                    </h4>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                      Resumos, Cadernos Digitais e Relatórios Clínicos
                    </span>
                  </div>
                </div>

                <a
                  href="https://docs.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  Abrir Docs <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                Escreva seus resumos, faça fichas de estudo e acesse seus cadernos e anotações de cada matéria da faculdade.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Subjects & Topics Management Section */}
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Matérias & Temas de Estudo ({studySubjects.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar matéria ou tema..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenSubjectModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nova Matéria
            </button>
          </div>
        </div>

        {/* Subjects List */}
        {filteredSubjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhuma matéria cadastrada no seu plano de estudos.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Personalize suas matérias de acordo com a sua grade curricular e adicione os temas que precisa estudar para as provas.
            </p>
            <button
              type="button"
              onClick={() => handleOpenSubjectModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar Primeira Matéria
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredSubjects.map(subject => {
              const completedCount = subject.topics.filter(t => t.completed).length;
              const totalCount = subject.topics.length;
              const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  {/* Subject Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color || '#10b981' }}
                        />
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {subject.name}
                          </h4>
                          {subject.professor && (
                            <span className="text-xs text-slate-400 block font-medium">
                              Prof(a): {subject.professor}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenSubjectModal(subject)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Editar matéria"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubjectToDelete(subject)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Excluir matéria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Direct Google Launchers for Subject */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <a
                        href={subject.driveFolderUrl || `https://drive.google.com/drive/search?q=${encodeURIComponent(subject.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
                        title={subject.driveFolderUrl ? "Abrir pasta específica vinculada no Google Drive" : `Buscar e selecionar arquivos de ${subject.name} no Google Drive`}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{subject.driveFolderUrl ? 'Pasta Drive' : 'Abrir Drive'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>

                      <a
                        href={subject.googleDocsUrl || `https://docs.google.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-2xs"
                        title={subject.googleDocsUrl ? "Abrir caderno de anotações no Google Docs" : `Abrir Google Docs para ${subject.name}`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{subject.googleDocsUrl ? 'Caderno Docs' : 'Abrir Docs'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>

                      <a
                        href="https://docs.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="Criar um novo documento em branco no Google Docs"
                      >
                        <FilePlus className="w-3 h-3 text-blue-500" />
                        <span>+ Novo Resumo</span>
                      </a>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {completedCount} de {totalCount} temas concluídos
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: subject.color || '#10b981'
                          }}
                        />
                      </div>
                    </div>

                    {/* Topics Checklist */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Temas & Conteúdos a Estudar:
                      </span>

                      {subject.topics.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Nenhum tema adicionado ainda para esta matéria.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {subject.topics.map(topic => (
                            <div
                              key={topic.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                                topic.completed
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-400'
                                  : 'bg-[#F3F7F5]/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div
                                onClick={() => toggleStudyTopic(subject.id, topic.id)}
                                className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                              >
                                {topic.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className={`text-xs font-semibold ${topic.completed ? 'line-through' : ''}`}>
                                  {topic.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {topic.docLink && (
                                  <a
                                    href={topic.docLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 p-1"
                                    title="Abrir anotação Google Doc"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                                  topic.priority === 'alta'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    : topic.priority === 'media'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {topic.priority}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteStudyTopic(subject.id, topic.id)}
                                  className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Excluir tema"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add New Topic Input Box */}
                  <div className="pt-3 border-t border-emerald-100/60 dark:border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={newTopicTitles[subject.id] || ''}
                      onChange={e => setNewTopicTitles({ ...newTopicTitles, [subject.id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddTopic(subject.id);
                      }}
                      placeholder="+ Adicionar tema (ex: Acesso Coronário)..."
                      className="flex-1 px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />

                    <select
                      value={newTopicPriorities[subject.id] || 'media'}
                      onChange={e => setNewTopicPriorities({ ...newTopicPriorities, [subject.id]: e.target.value as any })}
                      className="px-2 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddTopic(subject.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Delete Subject */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Excluir Matéria?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tem certeza que deseja remover <strong>"{subjectToDelete.name}"</strong> e todos os seus temas de estudo?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubjectConfirmed(subjectToDelete.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Exam */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remover Prova?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deseja remover a avaliação de <strong>"{examToDelete.subject}"</strong> marcada para {new Date(examToDelete.examDate + 'T00:00:00').toLocaleDateString('pt-BR')}?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExamConfirmed(examToDelete.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                {editingSubject ? 'Editar Matéria' : 'Nova Matéria de Estudo'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSubjectModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Matéria / Disciplina *
                </label>
                <input
                  type="text"
                  required
                  value={subjName}
                  onChange={e => setSubjName(e.target.value)}
                  placeholder="Ex: Farmacologia Aplicada, Dentística..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Professor(a) Responsável
                  </label>
                  <input
                    type="text"
                    value={subjProfessor}
                    onChange={e => setSubjProfessor(e.target.value)}
                    placeholder="Prof. Dr..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cor de Identificação
                  </label>
                  <input
                    type="color"
                    value={subjColor}
                    onChange={e => setSubjColor(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Pasta no Google Drive (opcional)
                  </label>
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <FolderOpen className="w-3 h-3" /> Abrir Drive <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="url"
                  value={subjDriveUrl}
                  onChange={e => setSubjDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Caderno / Resumo no Google Docs (opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://docs.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <FilePlus className="w-3 h-3" /> Criar Docs <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <input
                  type="url"
                  value={subjDocsUrl}
                  onChange={e => setSubjDocsUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {editingSubject ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectToDelete(editingSubject);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Matéria
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSubjectModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Salvar Matéria
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Exam */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {editingExam ? 'Editar Prova' : 'Agendar Nova Prova'}
              </h3>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Matéria / Disciplina da Prova *
                </label>
                <input
                  type="text"
                  required
                  value={examSubject}
                  onChange={e => setExamSubject(e.target.value)}
                  placeholder="Ex: Cirurgia Bucomaxilofacial, Dentística..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data da Prova *
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={e => setExamTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Conteúdos e Capítulos Cobrados (opcional)
                </label>
                <textarea
                  rows={3}
                  value={examTopics}
                  onChange={e => setExamTopics(e.target.value)}
                  placeholder="Ex: Anestesiologia, Técnicas cirúrgicas de dentes inclusos, Farmacologia pós-operatória..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {editingExam ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExamToDelete(editingExam);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover Prova
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Salvar Prova
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
