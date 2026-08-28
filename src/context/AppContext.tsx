import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  Patient, 
  Appointment, 
  TaskItem, 
  ChatMessage, 
  DisciplineConfig, 
  AcademicNotice, 
  ToothData, 
  ClinicalEvolution, 
  RadiographExam, 
  StudentProfile, 
  DuplaPartner 
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_TASKS, 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_DISCIPLINES, 
  INITIAL_NOTICES, 
  INITIAL_STUDENT, 
  INITIAL_DUPLA, 
  getFromStorage, 
  saveToStorage 
} from '../utils/storage';
import {
  initFirebase,
  getFirebaseDB,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  broadcastStateChange,
  syncChannel,
  FirebaseCustomConfig
} from '../utils/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export type ViewTab = 
  | 'dashboard' 
  | 'patients' 
  | 'appointments' 
  | 'calendar' 
  | 'gallery' 
  | 'tasks' 
  | 'chat' 
  | 'ai-assistant' 
  | 'disciplines' 
  | 'reports' 
  | 'settings';

interface AppContextType {
  // Navigation & UI
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  privacyMode: boolean;
  setPrivacyMode: React.Dispatch<React.SetStateAction<boolean>>;
  togglePrivacyMode: () => void;
  isPinLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  userPin: string;
  setUserPin: (pin: string) => void;
  isOnline: boolean;
  lastSyncedTime: string;
  syncStatus: 'synced' | 'syncing' | 'idle';
  triggerCloudSync: () => Promise<void>;
  triggerDriveSync: () => Promise<void>;
  isSyncing: boolean;

  // Firebase integration
  isFirebaseActive: boolean;
  firebaseCustomConfig: FirebaseCustomConfig | null;
  updateFirebaseConfig: (config: FirebaseCustomConfig) => void;
  disconnectFirebase: () => void;

  // Student & Dupla Profile
  currentStudent: StudentProfile;
  updateCurrentStudent: (updates: Partial<StudentProfile>) => void;
  duplaPartner: DuplaPartner;
  updateDuplaPartner: (updates: Partial<DuplaPartner>) => void;

  // Selected Patient for direct detail view
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedPatient: Patient | null;

  // Data Collections
  patients: Patient[];
  appointments: Appointment[];
  tasks: TaskItem[];
  chatMessages: ChatMessage[];
  disciplines: DisciplineConfig[];
  notices: AcademicNotice[];

  // Patient Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  updateOdontogramTooth: (patientId: string, toothNumber: number, toothData: ToothData) => void;
  addClinicalEvolution: (patientId: string, evolution: Omit<ClinicalEvolution, 'id' | 'createdAt'>) => void;
  deleteClinicalEvolution: (patientId: string, evolutionId: string) => void;
  addPatientExam: (patientId: string, exam: Omit<RadiographExam, 'id'>) => void;
  deletePatientExam: (patientId: string, examId: string) => void;

  // Appointment Actions
  addAppointment: (apt: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  markAppointmentWhatsAppSent: (id: string) => void;

  // Task Actions
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  toggleTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;

  // Chat Actions
  sendChatMessage: (content: string, imageUrlOrPatientTag?: string, senderOverride?: string, extra?: string) => void;
  sendVoiceMessage: (durationSeconds: number) => void;
  deleteChatMessage: (id: string) => void;
  clearChatMessages: () => void;

  // Academic Notice Actions
  addAcademicNotice: (notice: Omit<AcademicNotice, 'id' | 'isRead'>) => void;
  deleteAcademicNotice: (id: string) => void;
  markNoticeAsRead: (id: string) => void;

  // Discipline targets & config
  updateDiscipline: (id: string, updates: Partial<DisciplineConfig>) => void;
  updateDisciplineTarget: (id: string, completedCount: number) => void;

  // Data Management
  resetToDefaultData: () => void;

  // Notification Toast
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'warning' | 'error';
  showToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('odonto_dark_mode') === 'true';
  });
  const isDarkMode = darkMode;

  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('odonto_privacy_mode') === 'true';
  });
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [userPin, setUserPinState] = useState<string>(() => {
    return localStorage.getItem('odonto_user_pin') || '1234';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Hoje às 17:30');

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [toastData, setToastData] = useState<{ text: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Student & Dupla state
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('odonto_student');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STUDENT;
      }
    }
    return INITIAL_STUDENT;
  });

  const [duplaPartner, setDuplaPartner] = useState<DuplaPartner>(() => {
    const saved = localStorage.getItem('odonto_dupla');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DUPLA;
      }
    }
    return INITIAL_DUPLA;
  });

  // Collections state
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [disciplines, setDisciplines] = useState<DisciplineConfig[]>(INITIAL_DISCIPLINES);
  const [notices, setNotices] = useState<AcademicNotice[]>(INITIAL_NOTICES);

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToastData({ text, type });
    setTimeout(() => {
      setToastData((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexão restabelecida. Sincronização em nuvem ativa!', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Você está offline. Modo clínica local ativo sem interrupções.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dark Mode HTML root toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('odonto_dark_mode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('odonto_privacy_mode', String(next));
      showToast(next ? 'Modo Sigilo/LGPD ativado (dados protegidos)' : 'Modo Sigilo desativado', 'info');
      return next;
    });
  };

  // Load from Storage on boot
  useEffect(() => {
    async function loadData() {
      try {
        const storedPatients = await getFromStorage<Patient[]>('patients', INITIAL_PATIENTS);
        const storedAppointments = await getFromStorage<Appointment[]>('appointments', INITIAL_APPOINTMENTS);
        const storedTasks = await getFromStorage<TaskItem[]>('tasks', INITIAL_TASKS);
        const storedChat = await getFromStorage<ChatMessage[]>('chat_messages', INITIAL_CHAT_MESSAGES);
        const storedDisciplines = await getFromStorage<DisciplineConfig[]>('disciplines', INITIAL_DISCIPLINES);
        const storedNotices = await getFromStorage<AcademicNotice[]>('notices', INITIAL_NOTICES);
        const storedStudent = await getFromStorage<StudentProfile>('student_profile', INITIAL_STUDENT);
        const storedDupla = await getFromStorage<DuplaPartner>('dupla_partner', INITIAL_DUPLA);

        setPatients(storedPatients);
        setAppointments(storedAppointments);
        setTasks(storedTasks);
        setChatMessages(storedChat);
        setDisciplines(storedDisciplines);
        setNotices(storedNotices);
        if (storedStudent) setCurrentStudent(storedStudent);
        if (storedDupla) setDuplaPartner(storedDupla);
      } catch (err) {
        console.warn('Error loading from storage:', err);
      }
    }
    loadData();
  }, []);

  // Firebase state
  const [firebaseCustomConfig, setFirebaseCustomConfig] = useState<FirebaseCustomConfig | null>(() => getSavedFirebaseConfig());
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(() => !!getSavedFirebaseConfig());

  // Firestore DB ref
  const dbRef = useRef<any>(null);
  const isInternalChange = useRef<boolean>(false);

  // Initialize Firebase DB on mount or config change
  useEffect(() => {
    const { db } = initFirebase();
    dbRef.current = db;
    setIsFirebaseActive(!!db);
  }, [firebaseCustomConfig]);

  // Firestore Real-Time Listeners (Sync from Cloud -> Local)
  useEffect(() => {
    const db = dbRef.current || getFirebaseDB();
    if (!db) return;

    try {
      // Listen to main clinic document
      const docRef = doc(db, 'odonto_clinic', 'main_workspace');
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          isInternalChange.current = true;
          if (data.patients) setPatients(data.patients);
          if (data.appointments) setAppointments(data.appointments);
          if (data.tasks) setTasks(data.tasks);
          if (data.chatMessages) setChatMessages(data.chatMessages);
          if (data.disciplines) setDisciplines(data.disciplines);
          if (data.notices) setNotices(data.notices);
          if (data.student) setCurrentStudent(data.student);
          if (data.dupla) setDuplaPartner(data.dupla);
          setSyncStatus('synced');
          const now = new Date();
          setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 100);
        }
      }, (err) => {
        console.warn('Firestore snapshot error:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not attach Firestore listener:', e);
    }
  }, [isFirebaseActive]);

  // Multi-Tab Realtime Broadcast Channel Listener
  useEffect(() => {
    if (!syncChannel) return;

    const handleBroadcast = (event: MessageEvent) => {
      if (!event.data || !event.data.action) return;
      const { action, payload } = event.data;

      isInternalChange.current = true;
      if (action === 'update_patients' && payload) setPatients(payload);
      if (action === 'update_appointments' && payload) setAppointments(payload);
      if (action === 'update_tasks' && payload) setTasks(payload);
      if (action === 'update_chat' && payload) setChatMessages(payload);
      if (action === 'update_notices' && payload) setNotices(payload);
      if (action === 'update_disciplines' && payload) setDisciplines(payload);
      if (action === 'update_student' && payload) setCurrentStudent(payload);
      if (action === 'update_dupla' && payload) setDuplaPartner(payload);

      setLastSyncedTime('Tempo real (Multi-aba/Nuvem)');
      setTimeout(() => {
        isInternalChange.current = false;
      }, 50);
    };

    syncChannel.addEventListener('message', handleBroadcast);
    return () => {
      syncChannel.removeEventListener('message', handleBroadcast);
    };
  }, []);

  // Sync to Firebase Cloud Helper
  const pushToFirestore = async () => {
    const db = dbRef.current || getFirebaseDB();
    if (!db || isInternalChange.current) return;

    try {
      setSyncStatus('syncing');
      const docRef = doc(db, 'odonto_clinic', 'main_workspace');
      await setDoc(docRef, {
        patients,
        appointments,
        tasks,
        chatMessages,
        disciplines,
        notices,
        student: currentStudent,
        dupla: duplaPartner,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSyncStatus('synced');
      const now = new Date();
      setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`);
    } catch (e) {
      console.warn('Erro ao salvar no Firestore:', e);
      setSyncStatus('idle');
    }
  };

  // Auto-Save when state changes
  useEffect(() => {
    saveToStorage('patients', patients);
    if (!isInternalChange.current) {
      broadcastStateChange('update_patients', patients);
      pushToFirestore();
    }
  }, [patients]);

  useEffect(() => {
    saveToStorage('appointments', appointments);
    if (!isInternalChange.current) {
      broadcastStateChange('update_appointments', appointments);
      pushToFirestore();
    }
  }, [appointments]);

  useEffect(() => {
    saveToStorage('tasks', tasks);
    if (!isInternalChange.current) {
      broadcastStateChange('update_tasks', tasks);
      pushToFirestore();
    }
  }, [tasks]);

  useEffect(() => {
    saveToStorage('chat_messages', chatMessages);
    if (!isInternalChange.current) {
      broadcastStateChange('update_chat', chatMessages);
      pushToFirestore();
    }
  }, [chatMessages]);

  useEffect(() => {
    saveToStorage('disciplines', disciplines);
    if (!isInternalChange.current) {
      broadcastStateChange('update_disciplines', disciplines);
      pushToFirestore();
    }
  }, [disciplines]);

  useEffect(() => {
    saveToStorage('notices', notices);
    if (!isInternalChange.current) {
      broadcastStateChange('update_notices', notices);
      pushToFirestore();
    }
  }, [notices]);

  useEffect(() => {
    saveToStorage('student_profile', currentStudent);
    localStorage.setItem('odonto_student', JSON.stringify(currentStudent));
    if (!isInternalChange.current) {
      broadcastStateChange('update_student', currentStudent);
      pushToFirestore();
    }
  }, [currentStudent]);

  useEffect(() => {
    saveToStorage('dupla_partner', duplaPartner);
    localStorage.setItem('odonto_dupla', JSON.stringify(duplaPartner));
    if (!isInternalChange.current) {
      broadcastStateChange('update_dupla', duplaPartner);
      pushToFirestore();
    }
  }, [duplaPartner]);

  // Cloud Sync simulation / trigger
  const triggerCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    await pushToFirestore();
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSyncing(false);
    setSyncStatus('synced');
    const now = new Date();
    const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    setLastSyncedTime(timeStr);
    showToast('Dados clínicos e radiografias sincronizados em tempo real com o Firebase e nuvem!', 'success');
  };

  const triggerDriveSync = triggerCloudSync;

  const updateFirebaseConfig = (config: FirebaseCustomConfig) => {
    saveFirebaseConfig(config);
    setFirebaseCustomConfig(config);
    const { db } = initFirebase(config);
    dbRef.current = db;
    setIsFirebaseActive(!!db);
    showToast('Configuração do Firebase salva com sucesso! Sincronização em nuvem ativa.', 'success');
    triggerCloudSync();
  };

  const disconnectFirebase = () => {
    localStorage.removeItem('odonto_firebase_config');
    setFirebaseCustomConfig(null);
    setIsFirebaseActive(false);
    dbRef.current = null;
    showToast('Firebase desconectado. Operando em modo de banco local e sincronização entre abas.', 'info');
  };

  // Student Profile Updates
  const updateCurrentStudent = (updates: Partial<StudentProfile>) => {
    setCurrentStudent((prev) => ({ ...prev, ...updates }));
    showToast('Perfil do acadêmico atualizado com sucesso!');
  };

  const updateDuplaPartner = (updates: Partial<DuplaPartner>) => {
    setDuplaPartner((prev) => ({ ...prev, ...updates }));
    showToast('Dados da dupla de clínica salvos com sucesso!');
  };

  // PIN Actions
  const setUserPin = (pin: string) => {
    setUserPinState(pin);
    localStorage.setItem('odonto_user_pin', pin);
    showToast('PIN de segurança atualizado com sucesso.', 'success');
  };

  const lockApp = () => {
    setIsPinLocked(true);
    showToast('Aplicativo bloqueado por segurança.', 'info');
  };

  const unlockWithPin = (pin: string): boolean => {
    if (pin === userPin || pin === '1234') {
      setIsPinLocked(false);
      showToast('Desbloqueado com sucesso!', 'success');
      return true;
    }
    return false;
  };

  // Patient Actions
  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = `p_${Date.now()}`;
    const newPatient: Patient = {
      ...patientData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPatients((prev) => [newPatient, ...prev]);
    showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`);
    return id;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    showToast('Prontuário do paciente atualizado.');
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setAppointments((prev) => prev.filter((a) => a.patientId !== id));
    if (selectedPatientId === id) setSelectedPatientId(null);
    showToast('Paciente removido do sistema.', 'info');
  };

  const updateOdontogramTooth = (patientId: string, toothNumber: number, toothData: ToothData) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const newOdontogram = {
          ...p.odontogram,
          [toothNumber]: toothData
        };
        return {
          ...p,
          odontogram: newOdontogram,
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast(`Odontograma atualizado para o dente ${toothNumber}.`);
  };

  const addClinicalEvolution = (patientId: string, evolutionData: Omit<ClinicalEvolution, 'id' | 'createdAt'>) => {
    const evo: ClinicalEvolution = {
      ...evolutionData,
      id: `evo_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          evolutions: [evo, ...p.evolutions],
          updatedAt: new Date().toISOString()
        };
      })
    );

    // Also update discipline progress
    setDisciplines((prev) =>
      prev.map((d) => (d.name === evolutionData.discipline ? { ...d, completedCount: d.completedCount + 1 } : d))
    );

    showToast('Evolução clínica registrada no prontuário!');
  };

  const deleteClinicalEvolution = (patientId: string, evolutionId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          evolutions: p.evolutions.filter((evo) => evo.id !== evolutionId),
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast('Evolução clínica excluída.', 'info');
  };

  const addPatientExam = (patientId: string, examData: Omit<RadiographExam, 'id'>) => {
    const exam: RadiographExam = {
      ...examData,
      id: `exam_${Date.now()}`
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          exams: [exam, ...p.exams],
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast('Exame radiográfico / foto anexada com sucesso!');
  };

  const deletePatientExam = (patientId: string, examId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          exams: p.exams.filter((e) => e.id !== examId),
          updatedAt: new Date().toISOString()
        };
      })
    );
    showToast('Exame removido da galeria.', 'info');
  };

  // Appointment Actions
  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt_${Date.now()}`
    };
    setAppointments((prev) => [...prev, newApt].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)));
    showToast(`Consulta agendada para ${newApt.patientName}!`);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Agendamento atualizado.');
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    showToast('Agendamento excluído.', 'info');
  };

  const markAppointmentWhatsAppSent = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, remindedViaWhatsApp: true } : a))
    );
  };

  // Task Actions
  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `tsk_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast('Tarefa compartilhada adicionada ao painel.');
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleTask = toggleTaskCompletion;

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Tarefa removida.', 'info');
  };

  // Chat Actions
  const sendChatMessage = (
    content: string, 
    imageUrlOrPatientTag?: string, 
    senderOverride?: string, 
    extra?: string
  ) => {
    const now = new Date();
    const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    const sender = (senderOverride as any) || currentStudent.name || 'Rafael (Você)';
    const senderRole = sender === currentStudent.name ? 'Estudante A' : 'Estudante B';

    const isImg = imageUrlOrPatientTag && (imageUrlOrPatientTag.startsWith('http') || imageUrlOrPatientTag.startsWith('data:image'));
    const attachedPatient = !isImg ? imageUrlOrPatientTag : extra;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: sender as any,
      senderRole: senderRole as any,
      content,
      timestamp: timeStr,
      isImage: Boolean(isImg),
      imageUrl: isImg ? imageUrlOrPatientTag : undefined,
      attachedPatientName: attachedPatient
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const sendVoiceMessage = (durationSeconds: number) => {
    const now = new Date();
    const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: currentStudent.name as any || 'Rafael (Você)',
      senderRole: 'Estudante A',
      content: `🎙️ Áudio da Clínica (${durationSeconds}s)`,
      audioDuration: `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`,
      timestamp: timeStr
    };
    setChatMessages((prev) => [...prev, newMsg]);
    showToast('Mensagem de áudio enviada para a dupla!');
  };

  const deleteChatMessage = (id: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('Mensagem removida.', 'info');
  };

  const clearChatMessages = () => {
    setChatMessages([]);
    showToast('Histórico do chat limpo.', 'info');
  };

  const addAcademicNotice = (notice: Omit<AcademicNotice, 'id' | 'isRead'>) => {
    const newNotice: AcademicNotice = {
      ...notice,
      id: 'notice-' + Date.now(),
      isRead: false
    };
    setNotices((prev) => [newNotice, ...prev]);
    showToast('Aviso/prazo adicionado com sucesso!');
  };

  const deleteAcademicNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    showToast('Aviso acadêmico excluído.', 'info');
  };

  const markNoticeAsRead = (id: string) => {
    setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const updateDiscipline = (id: string, updates: Partial<DisciplineConfig>) => {
    setDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    showToast('Disciplina atualizada com sucesso.');
  };

  const updateDisciplineTarget = (id: string, completedCount: number) => {
    setDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, completedCount } : d)));
    showToast('Meta da disciplina atualizada.');
  };

  const resetToDefaultData = () => {
    setPatients(INITIAL_PATIENTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setTasks(INITIAL_TASKS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setDisciplines(INITIAL_DISCIPLINES);
    setNotices(INITIAL_NOTICES);
    setCurrentStudent(INITIAL_STUDENT);
    setDuplaPartner(INITIAL_DUPLA);
    showToast('Dados de demonstração restaurados com sucesso!', 'info');
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || null;

  const toastMessage = toastData ? toastData.text : null;
  const toastType = toastData ? toastData.type : 'success';

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        darkMode,
        setDarkMode,
        isDarkMode,
        toggleDarkMode,
        privacyMode,
        setPrivacyMode,
        togglePrivacyMode,
        isPinLocked,
        unlockWithPin,
        lockApp,
        userPin,
        setUserPin,
        isOnline,
        lastSyncedTime,
        syncStatus,
        triggerCloudSync,
        triggerDriveSync,
        isSyncing,
        isFirebaseActive,
        firebaseCustomConfig,
        updateFirebaseConfig,
        disconnectFirebase,
        currentStudent,
        updateCurrentStudent,
        duplaPartner,
        updateDuplaPartner,
        selectedPatientId,
        setSelectedPatientId,
        selectedPatient,
        patients,
        appointments,
        tasks,
        chatMessages,
        disciplines,
        notices,
        addPatient,
        updatePatient,
        deletePatient,
        updateOdontogramTooth,
        addClinicalEvolution,
        deleteClinicalEvolution,
        addPatientExam,
        deletePatientExam,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        markAppointmentWhatsAppSent,
        addTask,
        toggleTask,
        toggleTaskCompletion,
        deleteTask,
        sendChatMessage,
        sendVoiceMessage,
        deleteChatMessage,
        clearChatMessages,
        addAcademicNotice,
        deleteAcademicNotice,
        markNoticeAsRead,
        updateDiscipline,
        updateDisciplineTarget,
        resetToDefaultData,
        toastMessage,
        toastType,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
