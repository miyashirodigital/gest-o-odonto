import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { exportAcademicReportPDF } from '../utils/pdfGenerator';
import { 
  Settings, 
  Lock, 
  Moon, 
  Sun, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  GraduationCap,
  HardDrive,
  Users,
  FileText
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    currentStudent, 
    updateCurrentStudent, 
    duplaPartner, 
    updateDuplaPartner, 
    disciplines, 
    darkMode, 
    setDarkMode, 
    privacyMode, 
    setPrivacyMode, 
    resetToDefaultData, 
    patients, 
    showToast
  } = useApp();

  // Student details state
  const [studentName, setStudentName] = useState<string>(currentStudent?.name || 'Rafael Miyasiro');
  const [university, setUniversity] = useState<string>(currentStudent?.university || 'UEL - Universidade Estadual de Londrina');
  const [semester, setSemester] = useState<string>(currentStudent?.semester || '8º Semestre - Odontologia');
  const [academicId, setAcademicId] = useState<string>(currentStudent?.academicId || 'RA 2023-04821');

  // Dupla state
  const [duplaName, setDuplaName] = useState<string>(duplaPartner?.name || 'Beatriz Ramos');
  const [duplaSemester, setDuplaSemester] = useState<string>(duplaPartner?.semester || '8º Semestre');
  const [duplaPhone, setDuplaPhone] = useState<string>(duplaPartner?.phone || '(43) 99881-2233');

  useEffect(() => {
    if (currentStudent) {
      setStudentName(currentStudent.name || '');
      setUniversity(currentStudent.university || '');
      setSemester(currentStudent.semester || '');
      setAcademicId(currentStudent.academicId || '');
    }
  }, [currentStudent]);

  useEffect(() => {
    if (duplaPartner) {
      setDuplaName(duplaPartner.name || '');
      setDuplaSemester(duplaPartner.semester || '');
      setDuplaPhone(duplaPartner.phone || '');
    }
  }, [duplaPartner]);

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentStudent({
      name: studentName,
      university,
      semester,
      academicId
    });
    showToast('Dados do acadêmico e faculdade salvos com sucesso!');
  };

  const handleSaveDupla = (e: React.FormEvent) => {
    e.preventDefault();
    updateDuplaPartner({
      name: duplaName,
      semester: duplaSemester,
      phone: duplaPhone
    });
    showToast('Dados da dupla de clínica atualizados!');
  };

  const handleExportAcademicReport = () => {
    exportAcademicReportPDF(
      disciplines, 
      patients, 
      studentName || currentStudent?.name || 'Acadêmico', 
      semester || currentStudent?.semester || 'Odontologia'
    );
    showToast('Relatório Acadêmico Geral exportado em PDF com sucesso!');
  };

  const handleExportBackupJSON = () => {
    const backup = {
      app: 'OdontoClínica Universitária',
      exportDate: new Date().toISOString(),
      student: currentStudent,
      dupla: duplaPartner,
      disciplines,
      patients
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_odontoclinica_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup completo em JSON exportado com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Configurações do Prontuário, Dupla & Visual
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalização da sua faculdade, perfil da dupla, relatórios oficiais em PDF e proteção de dados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Dados do Acadêmico & Faculdade
          </h3>

          <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo:</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sua Faculdade / Universidade:
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Ex: UEL, USP, UNESP, PUC, UFPR..."
                className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Personaliza os menus, cabeçalhos, painel e relatórios com o nome da sua universidade.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Período / Ano:</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">R.A. / Matrícula:</label>
                <input
                  type="text"
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200/50 dark:shadow-none transition-transform active:scale-95"
            >
              Salvar Dados & Faculdade
            </button>
          </form>
        </div>

        {/* Dupla Partner Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Configuração da Dupla de Atendimento
          </h3>

          <form onSubmit={handleSaveDupla} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Dupla:</label>
              <input
                type="text"
                value={duplaName}
                onChange={(e) => setDuplaName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Período da Dupla:</label>
                <input
                  type="text"
                  value={duplaSemester}
                  onChange={(e) => setDuplaSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp:</label>
                <input
                  type="tel"
                  value={duplaPhone}
                  onChange={(e) => setDuplaPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200/50 dark:shadow-none transition-transform active:scale-95"
            >
              Salvar Dupla de Clínica
            </button>
          </form>
        </div>

        {/* Official Academic Reports & PDF Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Relatórios Acadêmicos & Documentação
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Gere e baixe o relatório consolidado de todos os atendimentos, evoluções clínicas por disciplina e procedimentos realizados para assinatura dos professores orientadores.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportAcademicReport}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 text-white" /> Baixar Relatório Acadêmico Geral (PDF)
            </button>
          </div>
        </div>

        {/* Security & Display Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Visual & Proteção de Dados (LGPD)
          </h3>

          <div className="space-y-3 text-xs">
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F3F7F5]/60 dark:bg-slate-800/50 border border-emerald-100/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {darkMode ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Modo Escuro</span>
                  <span className="text-[11px] text-slate-400">Leitura noturna e visualização de radiografias</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${darkMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Privacy Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F3F7F5]/60 dark:bg-slate-800/50 border border-emerald-100/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Modo Sigilo / Apresentação</span>
                  <span className="text-[11px] text-slate-400">Oculta CPF e dados sensíveis para projetar em aula</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${privacyMode ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${privacyMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Data Management */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Backup & Exportação
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Seus dados são salvos e sincronizados automaticamente na nuvem em tempo real. Você também pode exportar um arquivo de backup completo para o seu computador.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleExportBackupJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Exportar Backup (JSON)
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja restaurar os dados de demonstração da clínica?')) {
                  resetToDefaultData();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restaurar Amostra Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
