import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskItem, DisciplineType } from '../types';
import confetti from 'canvas-confetti';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  User, 
  CheckCircle2, 
  FolderKanban,
  Tag
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  Esterilização: '🧼',
  Laboratório: '🔬',
  Acadêmico: '📚',
  Geral: '📋'
};

export const TaskBoardView: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask, disciplines, currentStudent, duplaPartner, showToast } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');

  // New task form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TaskItem['category']>('Esterilização');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<TaskItem['priority']>('media');
  const [assignedTo, setAssignedTo] = useState<TaskItem['assignedTo']>('Rafael (Você)');
  const [discipline, setDiscipline] = useState<DisciplineType>('Dentística Restauradora');

  const handleToggle = (taskId: string, currentStatus: boolean) => {
    toggleTask(taskId);
    if (!currentStatus) {
      // Fire confetti when completing a task
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
      showToast('Tarefa concluída com sucesso!');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      category,
      dueDate,
      priority,
      assignedTo,
      discipline,
      completed: false
    });

    setTitle('');
    setShowAddForm(false);
    showToast('Nova tarefa compartilhada criada!');
  };

  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterAssignee !== 'all' && t.assignedTo !== filterAssignee) return false;
    if (filterDiscipline !== 'all' && t.discipline !== filterDiscipline) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-100/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Painel de Tarefas & Checklist da Dupla
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organização de kits cirúrgicos, envio de moldagens para laboratório e prazos de seminários
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              {completedTasks.length} de {filteredTasks.length} concluídas
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Sincronizado com {duplaPartner.name}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(prev => !prev)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* New Task Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 p-5 shadow-md space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Adicionar Nova Tarefa / Checklist
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          <div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Esterilizar kits de moldeira e espátula para a aula de Prótese..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskItem['category'])}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Esterilização">🧼 Esterilização & Autoclave</option>
                <option value="Laboratório">🔬 Laboratório Protético</option>
                <option value="Acadêmico">📚 Acadêmico & Seminários</option>
                <option value="Geral">📋 Geral & Pacientes</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Disciplina:</label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {disciplines.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Responsável:</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value as TaskItem['assignedTo'])}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="Rafael (Você)">Eu ({currentStudent.name.split(' ')[0]})</option>
                <option value="Dupla de Clínica">Dupla ({duplaPartner.name.split(' ')[0]})</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prazo Limite:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-slate-400">Categoria:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="Esterilização">Esterilização</option>
            <option value="Laboratório">Laboratório</option>
            <option value="Acadêmico">Acadêmico</option>
            <option value="Geral">Geral</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-slate-400">Responsável:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value={currentStudent.name}>Eu</option>
            <option value={duplaPartner.name}>{duplaPartner.name.split(' ')[0]}</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-slate-400">Disciplina:</span>
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todas</option>
            {disciplines.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Tarefas Pendentes ({pendingTasks.length})
            </h3>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs font-semibold">Tudo em dia! Nenhuma tarefa pendente neste filtro.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500/60 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggle(task.id, task.completed)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300">
                          {CATEGORY_ICONS[task.category] || '📋'} {task.category}
                        </span>
                        <span>{task.discipline}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <User className="w-3 h-3" /> {task.assignedTo.split(' ')[0]}
                        </span>
                        <span className="text-slate-400">
                          Prazo: {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tarefas Concluídas ({completedTasks.length})
            </h3>
          </div>

          {completedTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs">Nenhuma tarefa marcada como concluída ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-800/20 opacity-70 hover:opacity-100 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggle(task.id, task.completed)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />

                    <div className="space-y-0.5">
                      <p className="text-xs line-through text-slate-500 dark:text-slate-400">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{task.discipline}</span>
                        <span>• Concluído por {task.assignedTo.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
