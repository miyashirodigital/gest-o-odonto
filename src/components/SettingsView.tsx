import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { exportAcademicReportPDF } from '../utils/pdfGenerator';
import { 
  Settings, 
  User, 
  Users, 
  Lock, 
  Moon, 
  Sun, 
  CloudCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap,
  HardDrive,
  Database,
  Flame,
  CheckCircle,
  AlertCircle,
  Radio
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    currentStudent, 
    updateCurrentStudent, 
    duplaPartner, 
    updateDuplaPartner, 
    disciplines, 
    updateDiscipline, 
    darkMode, 
    setDarkMode, 
    privacyMode, 
    setPrivacyMode, 
    isOnline, 
    syncStatus, 
    lastSyncedTime,
    triggerDriveSync, 
    resetToDefaultData, 
    patients, 
    isFirebaseActive,
    firebaseCustomConfig,
    updateFirebaseConfig,
    disconnectFirebase,
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

  // Firebase Config Form State
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [fbApiKey, setFbApiKey] = useState<string>(firebaseCustomConfig?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState<string>(firebaseCustomConfig?.projectId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState<string>(firebaseCustomConfig?.authDomain || '');
  const [fbStorageBucket, setFbStorageBucket] = useState<string>(firebaseCustomConfig?.storageBucket || '');

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
    showToast('Dados do acadêmico salvos com sucesso!');
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
          Configurações do Prontuário, Dupla & Segurança
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalização acadêmica, modo noturno, proteção e sigilo de dados (LGPD) e sincronização
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Dados do Acadêmico Titular
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Universidade / Faculdade:</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-100 dark:border-slate-700 bg-[#F3F7F5]/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
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
              Atualizar Meus Dados
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
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Modo Escuro Elegante</span>
                  <span className="text-[11px] text-slate-400">Excelente para leitura noturna e análise de radiografias</span>
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
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Modo Sigilo / Apresentação de Casos</span>
                  <span className="text-[11px] text-slate-400">Oculta CPF e dados sensíveis para projetar em seminários</span>
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

        {/* Backup & Cloud Sync */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Sincronização & Backup de Dados
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todos os seus prontuários ficam salvos localmente no seu navegador/celular (IndexedDB) para uso 100% offline dentro da clínica universitária.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleExportBackupJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Exportar Backup (JSON)
            </button>
            <button
              type="button"
              onClick={() => triggerDriveSync()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200/50 dark:shadow-none"
            >
              <CloudCheck className="w-3.5 h-3.5" /> Sincronizar com a Nuvem
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja recarregar o banco de dados inicial de demonstração?')) {
                  resetToDefaultData();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restaurar Amostra Padrão
            </button>
          </div>
        </div>

        {/* Firebase Real-Time Firestore Integration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Integração Firebase Firestore em Tempo Real
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isFirebaseActive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" /> Conectado ao Firebase
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Sincronização Local & Multi-Aba Ativa
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            O aplicativo sincroniza seus atendimentos, odontogramas e recados instantaneamente em tempo real. Qualquer alteração feita é propagada imediatamente entre abas e aparelhos conectados.
          </p>

          <div className="p-4 rounded-2xl bg-[#F3F7F5]/60 dark:bg-slate-800/40 border border-emerald-100/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Status do Banco de Dados: {isFirebaseActive ? 'Firebase Firestore Nuvem' : 'IndexedDB Local + Multi-Tab Live Sync'}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                Última sincronização: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{lastSyncedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFirebaseModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Flame className="w-3.5 h-3.5" /> {isFirebaseActive ? 'Gerenciar Firebase' : 'Conectar Projeto Firebase'}
              </button>

              {isFirebaseActive && (
                <button
                  type="button"
                  onClick={disconnectFirebase}
                  className="px-3.5 py-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  Desconectar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Credentials Modal */}
      {showFirebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configuração do Firebase Firestore</h3>
                  <p className="text-[11px] text-slate-500">Insira as credenciais do seu projeto Firebase Console</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFirebaseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!fbApiKey.trim() || !fbProjectId.trim()) {
                  showToast('Preencha a API Key e o Project ID do Firebase.', 'error');
                  return;
                }
                updateFirebaseConfig({
                  apiKey: fbApiKey.trim(),
                  projectId: fbProjectId.trim(),
                  authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
                  storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`
                });
                setShowFirebaseModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: odonto-clinica-uel"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Firebase Web API Key *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AIzaSyD... (chave pública da Web)"
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Auth Domain (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="projeto.firebaseapp.com"
                    value={fbAuthDomain}
                    onChange={(e) => setFbAuthDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Bucket (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="projeto.appspot.com"
                    value={fbStorageBucket}
                    onChange={(e) => setFbStorageBucket(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold block text-slate-700 dark:text-slate-300">Como obter essas credenciais?</span>
                <p>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Firebase Console</a>, crie um projeto gratuito, adicione um app Web e copie as propriedades de configuração.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFirebaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  Conectar e Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
