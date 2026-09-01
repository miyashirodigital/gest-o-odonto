import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DashboardView } from './components/DashboardView';
import { PatientsListView } from './components/PatientsListView';
import { PatientDetailView } from './components/PatientDetailView';
import { CalendarView } from './components/CalendarView';
import { TaskBoardView } from './components/TaskBoardView';
import { StudyView } from './components/StudyView';
import { SettingsView } from './components/SettingsView';
import { AppointmentModal } from './components/AppointmentModal';
import { PatientModal } from './components/PatientModal';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CheckSquare, 
  Settings, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Lock, 
  Unlock, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  Plus, 
  Heart,
  ChevronRight,
  ShieldCheck,
  Search,
  Share2,
  BookOpen,
  UserPlus,
  CalendarPlus,
  RefreshCw
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    currentTab, 
    setCurrentTab, 
    selectedPatientId, 
    setSelectedPatientId, 
    patients, 
    darkMode, 
    setDarkMode, 
    privacyMode, 
    setPrivacyMode, 
    isOnline, 
    syncStatus, 
    triggerCloudSync,
    triggerDriveSync,
    connectedDevicesCount,
    isCloudConnected,
    lastSyncedTime,
    currentStudent,
    duplaPartner,
    toastMessage,
    toastType
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalAptModalPatientId, setGlobalAptModalPatientId] = useState<string | null>(null);
  const [showGlobalPatientModal, setShowGlobalPatientModal] = useState<boolean>(false);
  const [showGlobalNewAptModal, setShowGlobalNewAptModal] = useState<boolean>(false);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleNavClick = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    if (tab !== 'patients') {
      setSelectedPatientId(null);
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, badge: undefined },
    { id: 'patients' as const, label: 'Pacientes', icon: Users, badge: patients.length },
    { id: 'calendar' as const, label: 'Calendário', icon: Calendar, badge: undefined },
    { id: 'tasks' as const, label: 'Checklist & Tarefas', icon: CheckSquare, badge: undefined },
    { id: 'studies' as const, label: 'Estudos & Provas', icon: BookOpen, badge: undefined },
    { id: 'settings' as const, label: 'Configurações', icon: Settings, badge: undefined }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-[#0c1319] text-slate-100' : 'bg-[#F3F7F5] text-slate-800'}`}>
      {/* Mobile Hamburger Drawer Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Mobile Hamburger Slide-out Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-emerald-100 dark:border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between border-b border-emerald-100/60 dark:border-slate-800 pb-3">
            <div>
              <h1 className="font-bold text-base text-emerald-950 dark:text-emerald-100 leading-tight tracking-tight">
                Gestão Acadêmica
              </h1>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block truncate max-w-[180px]">
                {currentStudent?.university || 'Odontologia UEL'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Buttons in Mobile Drawer */}
          <div className="space-y-2">
            <p className="px-1 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              Ações Rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowGlobalPatientModal(true);
                }}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Paciente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowGlobalNewAptModal(true);
                }}
                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
              >
                <CalendarPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Novo Horário</span>
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            <p className="px-1 text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-widest">
              Navegação Principal
            </p>
            {navItems.map((item) => {
              const isActive = currentTab === item.id && !selectedPatientId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Student Profile */}
        <div className="space-y-3 pt-4 border-t border-emerald-100/60 dark:border-slate-800">
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0">
              {(currentStudent?.name || 'RM').split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold leading-none mb-1 text-white">{currentStudent?.name || 'Rafael Miyasiro'}</p>
              <p className="text-[10px] text-emerald-400 font-medium">{currentStudent?.semester || '8º Semestre'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                privacyMode
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Lock className="w-3 h-3" /> {privacyMode ? 'Sigilo On' : 'Sigilo'}
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1.5"
            >
              {darkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-emerald-600" />}
              {darkMode ? 'Claro' : 'Escuro'}
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Persistent Sidebar + Main Canvas Layout */}
      <div className="flex min-h-screen">
        {/* Desktop High Density Sidebar */}
        <aside className="hidden md:flex md:w-60 lg:w-64 bg-white dark:bg-slate-900 border-r border-emerald-100 dark:border-slate-800 flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="flex flex-col flex-1">
            {/* Brand Logo Header */}
            <div className="p-5 pb-3">
              <h1 className="font-bold text-lg text-emerald-950 dark:text-emerald-100 leading-tight tracking-tight">
                Gestão Acadêmica<br />
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest block truncate max-w-[200px]" title={currentStudent?.university || 'Odontologia UEL'}>
                  {currentStudent?.university || 'Odontologia UEL'}
                </span>
              </h1>
            </div>

            {/* Navigation links */}
            <div className="flex-1 px-4 py-2 space-y-1">
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
                Clínica & Atendimentos
              </p>
              {navItems.slice(0, 3).map((item) => {
                const isActive = currentTab === item.id && (!selectedPatientId || item.id === 'patients');

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3.5 py-2 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors text-xs sm:text-sm ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-800/60'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="mt-4 pt-2 border-t border-emerald-100/60 dark:border-slate-800">
                <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
                  Gestão, Estudos & Metas
                </p>
                {navItems.slice(3).map((item) => {
                  const isActive = currentTab === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`px-3.5 py-2 rounded-xl flex items-center justify-between font-medium cursor-pointer transition-colors text-xs sm:text-sm ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-800/60'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Student Profile Card */}
            <div className="p-4 mt-auto space-y-2">
              <div className="bg-slate-900 rounded-2xl p-3.5 text-white flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0">
                  {(currentStudent?.name || 'RM').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold leading-none mb-1 text-white truncate">{currentStudent?.name || 'Rafael Miyasiro'}</p>
                  <p className="text-[10px] text-emerald-400 font-medium truncate">{currentStudent?.semester || '8º Semestre'}</p>
                </div>
              </div>

              {/* Status / Quick toggles */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Prontuário Ativo
                </span>
                <button
                  type="button"
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    privacyMode
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Modo Sigilo LGPD"
                >
                  {privacyMode ? 'Sigilo On' : 'Sigilo'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header matching High Density theme (without "+" button as requested) */}
          <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
            {/* Left: Breadcrumbs / Mobile trigger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl border border-emerald-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span 
                  onClick={() => { setCurrentTab('dashboard'); setSelectedPatientId(null); }}
                  className="text-slate-400 hover:text-emerald-700 cursor-pointer font-medium"
                >
                  Home
                </span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  {selectedPatient ? selectedPatient.name : (navItems.find(n => n.id === currentTab)?.label || 'Atendimento')}
                </span>
              </div>
            </div>

            {/* Right: Clean controls with mode switches */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                type="button"
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  privacyMode
                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
                title="Ativar/Desativar proteção de dados dos pacientes"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{privacyMode ? 'Sigilo Ativo' : 'Modo Sigilo'}</span>
              </button>

              <button 
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
              </button>
            </div>
          </header>

          {/* Main Stage View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            {/* View Router */}
            {currentTab === 'dashboard' && <DashboardView />}

            {currentTab === 'patients' && (
              selectedPatient ? (
                <PatientDetailView
                  patient={selectedPatient}
                  onBack={() => setSelectedPatientId(null)}
                  onOpenAppointmentModal={(patId) => setGlobalAptModalPatientId(patId)}
                />
              ) : (
                <PatientsListView
                  onSelectPatient={(patId) => setSelectedPatientId(patId)}
                />
              )
            )}

            {currentTab === 'calendar' && <CalendarView />}

            {currentTab === 'tasks' && <TaskBoardView />}

            {currentTab === 'studies' && <StudyView />}

            {currentTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      {/* Global Appointment Modal if triggered */}
      {(globalAptModalPatientId || showGlobalNewAptModal) && (
        <AppointmentModal
          initialPatientId={globalAptModalPatientId || undefined}
          onClose={() => {
            setGlobalAptModalPatientId(null);
            setShowGlobalNewAptModal(false);
          }}
        />
      )}

      {/* Global Patient Modal for registration */}
      {showGlobalPatientModal && (
        <PatientModal
          onClose={() => setShowGlobalPatientModal(false)}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toastType === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : toastType === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

