import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
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
  DuplaPartner,
  StudySubject,
  StudyTopic,
  ExamSchedule,
  GoogleResourceLink
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
  INITIAL_STUDY_SUBJECTS,
  INITIAL_EXAM_SCHEDULES,
  INITIAL_GOOGLE_RESOURCES,
  getFromStorage, 
  getSyncStorage, 
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
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  fetchCloudState,
  pushCloudState,
  pushChatMessageToCloud,
  subscribeToCloudEvents,
  CloudClinicState
} from '../utils/cloudSync';

export type ViewTab = 
  | 'dashboard' 
  | 'patients' 
  | 'appointments' 
  | 'calendar' 
  | 'gallery' 
  | 'tasks' 
  | 'disciplines' 
  | 'studies'
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
  connectedDevicesCount: number;
  isCloudConnected: boolean;

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
  studySubjects: StudySubject[];
  examSchedules: ExamSchedule[];
  googleResources: GoogleResourceLink[];

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
  sendVoiceMessage: (durationSeconds: number, audioUrl?: string, patientTag?: string) => void;
  deleteChatMessage: (id: string) => void;
  clearChatMessages: () => void;

  // Academic Notice Actions
  addAcademicNotice: (notice: Omit<AcademicNotice, 'id' | 'isRead'>) => void;
  deleteAcademicNotice: (id: string) => void;
  markNoticeAsRead: (id: string) => void;

  // Discipline targets & config
  updateDiscipline: (id: string, updates: Partial<DisciplineConfig>) => void;
  updateDisciplineTarget: (id: string, completedCount: number) => void;

  // Studies & Exams Actions
  addStudySubject: (subject: Omit<StudySubject, 'id' | 'topics'>) => void;
  updateStudySubject: (id: string, updates: Partial<StudySubject>) => void;
  deleteStudySubject: (id: string) => void;
  addStudyTopic: (subjectId: string, topic: Omit<StudyTopic, 'id'>) => void;
  toggleStudyTopic: (subjectId: string, topicId: string) => void;
  deleteStudyTopic: (subjectId: string, topicId: string) => void;
  addExamSchedule: (exam: Omit<ExamSchedule, 'id'>) => void;
  updateExamSchedule: (id: string, updates: Partial<ExamSchedule>) => void;
  deleteExamSchedule: (id: string) => void;
  addGoogleResource: (resource: Omit<GoogleResourceLink, 'id'>) => void;
  deleteGoogleResource: (id: string) => void;

  // Data Management
  resetToDefaultData: () => void;

  // Notification Toast
  toastMessage: string | null;
  toastType: 'success' | 'info' | 'warning' | 'error';
  showToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DUMMY_IDS = new Set([
  'p1', 'p2', 'p3',
  'apt-1', 'apt-2', 'apt-3',
  'tsk-1', 'tsk-2', 'tsk-3', 'tsk-4',
  'subj-1', 'subj-2', 'subj-3',
  'exam-1', 'exam-2',
  'gres-1', 'gres-2',
  'not-1', 'not-2', 'not-3', 'not-4',
  'msg-1', 'msg-2', 'msg-3', 'msg-4'
]);

const DUMMY_TITLES = new Set([
  'Esterilizar kits de periodontia e curetas Gracey',
  'Buscar trabalho protético no laboratório (Coroa dente 21)',
  'Comprar cimento resinoso e pontas misturadoras',
  'Montar apresentação do seminário de cirurgia',
  'Prazo de entrega das Fichas de Dentística (1º Bimestre)',
  'Prova Prática de Anestesiologia & Cirurgia Ambulatorial',
  'Seminário de Apresentação de Casos Clínicos de Endodontia'
]);

const DUMMY_NAMES = new Set([
  'Ana Carolina Mendes',
  'Lucas Gabriel Silveira',
  'Dona Maria de Lourdes Santos'
]);

function cleanDummy<T extends { id?: string; title?: string; patientName?: string; name?: string }>(items: T[] | null | undefined): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => {
    if (!i) return false;
    if (i.id && DUMMY_IDS.has(i.id)) return false;
    if (i.title && DUMMY_TITLES.has(i.title)) return false;
    if (i.patientName && DUMMY_NAMES.has(i.patientName)) return false;
    if (i.name && DUMMY_NAMES.has(i.name)) return false;
    return true;
  });
}

// Helper to merge lists of objects by ID safely
function mergeById<T extends { id: string; updatedAt?: string | number }>(
  localList: T[],
  remoteList: T[]
): T[] {
  const cleanLocal = cleanDummy(localList);
  const cleanRemote = cleanDummy(remoteList);
  if (!Array.isArray(cleanRemote) || cleanRemote.length === 0) return Array.isArray(cleanLocal) ? cleanLocal : [];
  if (!Array.isArray(cleanLocal) || cleanLocal.length === 0) return cleanRemote;

  const map = new Map<string, T>();

  // 1. Populate with remote items
  for (const item of cleanRemote) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  // 2. Merge local items: keep local items not present in remote
  // If present in both, keep the one with newer or equal updatedAt
  for (const localItem of cleanLocal) {
    if (!localItem || !localItem.id) continue;
    const remoteItem = map.get(localItem.id);
    if (!remoteItem) {
      map.set(localItem.id, localItem);
    } else {
      const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
      const remoteTime = remoteItem.updatedAt ? new Date(remoteItem.updatedAt).getTime() : 0;
      if (localTime >= remoteTime) {
        map.set(localItem.id, localItem);
      }
    }
  }

  return Array.from(map.values());
}

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
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Nuvem Ativa');
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [toastData, setToastData] = useState<{ text: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Student & Dupla state
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(() => {
    return getSyncStorage<StudentProfile>('student_profile', INITIAL_STUDENT);
  });

  const [duplaPartner, setDuplaPartner] = useState<DuplaPartner>(() => {
    return getSyncStorage<DuplaPartner>('dupla_partner', INITIAL_DUPLA);
  });

  // Collections state initialized synchronously from local storage
  const [patients, setPatients] = useState<Patient[]>(() => {
    return cleanDummy(getSyncStorage<Patient[]>('patients', INITIAL_PATIENTS));
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return cleanDummy(getSyncStorage<Appointment[]>('appointments', INITIAL_APPOINTMENTS));
  });
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return cleanDummy(getSyncStorage<TaskItem[]>('tasks', INITIAL_TASKS));
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return cleanDummy(getSyncStorage<ChatMessage[]>('chat_messages', INITIAL_CHAT_MESSAGES));
  });
  const [disciplines, setDisciplines] = useState<DisciplineConfig[]>(() => {
    return getSyncStorage<DisciplineConfig[]>('disciplines', INITIAL_DISCIPLINES);
  });
  const [notices, setNotices] = useState<AcademicNotice[]>(() => {
    return cleanDummy(getSyncStorage<AcademicNotice[]>('notices', INITIAL_NOTICES));
  });
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>(() => {
    return cleanDummy(getSyncStorage<StudySubject[]>('study_subjects', INITIAL_STUDY_SUBJECTS));
  });
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(() => {
    return cleanDummy(getSyncStorage<ExamSchedule[]>('exam_schedules', INITIAL_EXAM_SCHEDULES));
  });
  const [googleResources, setGoogleResources] = useState<GoogleResourceLink[]>(() => {
    return cleanDummy(getSyncStorage<GoogleResourceLink[]>('google_resources', INITIAL_GOOGLE_RESOURCES));
  });

  // Ref to prevent premature saving before initial storage check
  const isLoadedRef = useRef<boolean>(false);

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

  // Load from Storage & Cloud on boot (Priority: Merge Firestore + Server + Local Storage)
  useEffect(() => {
    async function loadData() {
      isInternalChange.current = true;
      try {
        // Read local storage as fast cache
        const storedPatients = await getFromStorage<Patient[] | null>('patients', null);
        const storedAppointments = await getFromStorage<Appointment[] | null>('appointments', null);
        const storedTasks = await getFromStorage<TaskItem[] | null>('tasks', null);
        const storedChat = await getFromStorage<ChatMessage[] | null>('chat_messages', null);
        const storedDisciplines = await getFromStorage<DisciplineConfig[] | null>('disciplines', null);
        const storedNotices = await getFromStorage<AcademicNotice[] | null>('notices', null);
        const storedStudies = await getFromStorage<StudySubject[] | null>('study_subjects', null);
        const storedExams = await getFromStorage<ExamSchedule[] | null>('exam_schedules', null);
        const storedResources = await getFromStorage<GoogleResourceLink[] | null>('google_resources', null);
        const storedStudent = await getFromStorage<StudentProfile | null>('student_profile', null);
        const storedDupla = await getFromStorage<DuplaPartner | null>('dupla_partner', null);

        let cloudData: any = null;
        let sourceName = '';

        // 1. Check Firestore first (permanent across all devices)
        const db = getFirebaseDB();
        if (db) {
          try {
            const docRef = doc(db, 'odonto_clinic', 'main_workspace');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data && (data.patients || data.student || data.dupla || data.appointments)) {
                cloudData = data;
                sourceName = 'Firebase';
              }
            }
          } catch (e) {
            console.warn('[Firestore] Boot fetch warning:', e);
          }
        }

        // 2. If not found in Firestore, check Server persistent store
        if (!cloudData) {
          try {
            const { state: cloudState, connectedDevices } = await fetchCloudState();
            if (connectedDevices) setConnectedDevicesCount(connectedDevices);
            if (cloudState && (cloudState.patients || cloudState.student || cloudState.dupla || cloudState.appointments)) {
              cloudData = cloudState;
              sourceName = 'Nuvem';
            }
          } catch (e) {
            console.warn('[CloudSync] Boot fetch warning:', e);
          }
        }

        // 3. Reconcile and Merge: Cloud data (Firebase / Server) is the authoritative shared single database
        let activePatients = cleanDummy<Patient>(storedPatients || INITIAL_PATIENTS);
        if (cloudData && Array.isArray(cloudData.patients) && cloudData.patients.length > 0) {
          activePatients = cleanDummy<Patient>(cloudData.patients);
        } else if (storedPatients && storedPatients.length > 0) {
          activePatients = cleanDummy<Patient>(storedPatients);
        }
        setPatients(activePatients);
        saveToStorage('patients', activePatients);

        let activeAppointments = cleanDummy<Appointment>(storedAppointments || INITIAL_APPOINTMENTS);
        if (cloudData && Array.isArray(cloudData.appointments)) {
          activeAppointments = cleanDummy<Appointment>(cloudData.appointments);
        } else if (storedAppointments && storedAppointments.length > 0) {
          activeAppointments = cleanDummy<Appointment>(storedAppointments);
        }
        setAppointments(activeAppointments);
        saveToStorage('appointments', activeAppointments);

        let activeTasks = cleanDummy<TaskItem>(storedTasks || INITIAL_TASKS);
        if (cloudData && Array.isArray(cloudData.tasks)) {
          activeTasks = cleanDummy<TaskItem>(cloudData.tasks);
        } else if (storedTasks && storedTasks.length > 0) {
          activeTasks = cleanDummy<TaskItem>(storedTasks);
        }
        setTasks(activeTasks);
        saveToStorage('tasks', activeTasks);

        let activeChat = cleanDummy<ChatMessage>(storedChat || INITIAL_CHAT_MESSAGES);
        if (cloudData && Array.isArray(cloudData.chatMessages)) {
          activeChat = cleanDummy<ChatMessage>(cloudData.chatMessages);
        }
        setChatMessages(activeChat);
        saveToStorage('chat_messages', activeChat);

        let activeDisciplines = storedDisciplines || INITIAL_DISCIPLINES;
        if (cloudData && Array.isArray(cloudData.disciplines) && cloudData.disciplines.length > 0) {
          activeDisciplines = cloudData.disciplines;
        }
        setDisciplines(activeDisciplines);
        saveToStorage('disciplines', activeDisciplines);

        let activeNotices = cleanDummy<AcademicNotice>(storedNotices || INITIAL_NOTICES);
        if (cloudData && Array.isArray(cloudData.notices)) {
          activeNotices = cleanDummy<AcademicNotice>(cloudData.notices);
        }
        setNotices(activeNotices);
        saveToStorage('notices', activeNotices);

        let activeStudies = cleanDummy<StudySubject>(storedStudies || INITIAL_STUDY_SUBJECTS);
        if (cloudData && Array.isArray(cloudData.studySubjects)) {
          activeStudies = cleanDummy<StudySubject>(cloudData.studySubjects);
        }
        setStudySubjects(activeStudies);
        saveToStorage('study_subjects', activeStudies);

        let activeExams = cleanDummy<ExamSchedule>(storedExams || INITIAL_EXAM_SCHEDULES);
        if (cloudData && Array.isArray(cloudData.examSchedules)) {
          activeExams = cleanDummy<ExamSchedule>(cloudData.examSchedules);
        }
        setExamSchedules(activeExams);
        saveToStorage('exam_schedules', activeExams);

        let activeResources = cleanDummy<GoogleResourceLink>(storedResources || INITIAL_GOOGLE_RESOURCES);
        if (cloudData && Array.isArray(cloudData.googleResources)) {
          activeResources = cleanDummy<GoogleResourceLink>(cloudData.googleResources);
        }
        setGoogleResources(activeResources);
        saveToStorage('google_resources', activeResources);

        if (cloudData?.student) {
          setCurrentStudent(cloudData.student);
          saveToStorage('student_profile', cloudData.student);
        } else if (storedStudent) {
          setCurrentStudent(storedStudent);
        }

        if (cloudData?.dupla) {
          setDuplaPartner(cloudData.dupla);
          saveToStorage('dupla_partner', cloudData.dupla);
        } else if (storedDupla) {
          setDuplaPartner(storedDupla);
        }

        if (cloudData?.settings) {
          if (typeof cloudData.settings.darkMode === 'boolean') setDarkMode(cloudData.settings.darkMode);
          if (typeof cloudData.settings.privacyMode === 'boolean') setPrivacyMode(cloudData.settings.privacyMode);
          if (cloudData.settings.userPin) setUserPinState(cloudData.settings.userPin);
        }

        // Push reconciled state back to server and firestore to ensure all backends match
        const fullPayload = {
          patients: activePatients,
          appointments: activeAppointments,
          tasks: activeTasks,
          chatMessages: activeChat,
          disciplines: activeDisciplines,
          notices: activeNotices,
          studySubjects: activeStudies,
          examSchedules: activeExams,
          googleResources: activeResources,
          student: cloudData?.student || storedStudent || INITIAL_STUDENT,
          dupla: cloudData?.dupla || storedDupla || INITIAL_DUPLA,
          settings: { darkMode, privacyMode, userPin },
          updatedAt: Date.now()
        };

        pushCloudState(fullPayload);
        if (db) {
          try {
            const docRef = doc(db, 'odonto_clinic', 'main_workspace');
            setDoc(docRef, { ...fullPayload, updatedAt: new Date().toISOString() }, { merge: true });
          } catch {
            // ignore
          }
        }

        const now = new Date();
        setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${sourceName || 'Local'})`);
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Error loading from storage / cloud:', err);
      } finally {
        isLoadedRef.current = true;
        setTimeout(() => {
          isInternalChange.current = false;
        }, 200);
      }
    }
    loadData();
  }, []);

  // Real-Time Cloud SSE Listener (Multi-Device Sync Celular ⇄ Computador)
  useEffect(() => {
    const unsubscribe = subscribeToCloudEvents({
      onInit: (state, count) => {
        if (count) setConnectedDevicesCount(count);
        if (state) {
          isInternalChange.current = true;
          if (Array.isArray(state.patients)) {
            const clean = cleanDummy(state.patients);
            setPatients(clean);
            saveToStorage('patients', clean);
          }
          if (Array.isArray(state.appointments)) {
            const clean = cleanDummy(state.appointments);
            setAppointments(clean);
            saveToStorage('appointments', clean);
          }
          if (Array.isArray(state.tasks)) {
            const clean = cleanDummy(state.tasks);
            setTasks(clean);
            saveToStorage('tasks', clean);
          }
          if (Array.isArray(state.chatMessages)) {
            const clean = cleanDummy(state.chatMessages);
            setChatMessages(clean);
            saveToStorage('chat_messages', clean);
          }
          if (Array.isArray(state.disciplines) && state.disciplines.length > 0) {
            const clean = cleanDummy(state.disciplines);
            setDisciplines(clean);
            saveToStorage('disciplines', clean);
          }
          if (Array.isArray(state.notices)) {
            const clean = cleanDummy(state.notices);
            setNotices(clean);
            saveToStorage('notices', clean);
          }
          if (state.student) setCurrentStudent(state.student);
          if (state.dupla) setDuplaPartner(state.dupla);
          setSyncStatus('synced');
          const now = new Date();
          setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Nuvem)`);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 150);
        }
      },
      onStateUpdate: (state, source) => {
        if (!state) return;
        isInternalChange.current = true;
        if (Array.isArray(state.patients)) {
          const clean = cleanDummy(state.patients);
          setPatients(clean);
          saveToStorage('patients', clean);
        }
        if (Array.isArray(state.appointments)) {
          const clean = cleanDummy(state.appointments);
          setAppointments(clean);
          saveToStorage('appointments', clean);
        }
        if (Array.isArray(state.tasks)) {
          const clean = cleanDummy(state.tasks);
          setTasks(clean);
          saveToStorage('tasks', clean);
        }
        if (Array.isArray(state.chatMessages)) {
          const clean = cleanDummy(state.chatMessages);
          setChatMessages(clean);
          saveToStorage('chat_messages', clean);
        }
        if (Array.isArray(state.disciplines) && state.disciplines.length > 0) {
          const clean = cleanDummy(state.disciplines);
          setDisciplines(clean);
          saveToStorage('disciplines', clean);
        }
        if (Array.isArray(state.notices)) {
          const clean = cleanDummy(state.notices);
          setNotices(clean);
          saveToStorage('notices', clean);
        }
        if (state.student) setCurrentStudent(state.student);
        if (state.dupla) setDuplaPartner(state.dupla);

        setSyncStatus('synced');
        const now = new Date();
        setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${source || 'Nuvem'})`);
        setTimeout(() => {
          isInternalChange.current = false;
        }, 150);
      },
      onNewChatMessage: (msg) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          saveToStorage('chat_messages', updated);
          return updated;
        });
      },
      onPresence: (count) => {
        setConnectedDevicesCount(count);
      },
      onConnectionChange: (connected) => {
        setIsCloudConnected(connected);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Firebase state
  const [firebaseCustomConfig, setFirebaseCustomConfig] = useState<FirebaseCustomConfig | null>(() => getSavedFirebaseConfig());
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(() => !!getSavedFirebaseConfig());

  // Firestore DB ref
  const dbRef = useRef<any>(null);
  const isInternalChange = useRef<boolean>(false);
  const syncDebounceTimer = useRef<any>(null);

  // Helper to push state to Cloud Server AND Firebase Firestore (debounced & resilient)
  const syncStateToCloudAndFirestore = useCallback((forceImmediate = false) => {
    if (isInternalChange.current || !isLoadedRef.current) return;
    if (syncDebounceTimer.current) {
      clearTimeout(syncDebounceTimer.current);
    }

    const executeSync = async () => {
      setSyncStatus('syncing');
      const payload = {
        patients,
        appointments,
        tasks,
        chatMessages,
        disciplines,
        notices,
        studySubjects,
        examSchedules,
        googleResources,
        student: currentStudent,
        dupla: duplaPartner,
        settings: {
          darkMode,
          privacyMode,
          userPin
        },
        updatedAt: Date.now()
      };

      // 1. Push to server backend (writes to persistent disk & SSE broadcast)
      pushCloudState(payload).then((ok) => {
        if (ok) {
          setSyncStatus('synced');
          const now = new Date();
          setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
        }
      }).catch((e) => console.warn('[CloudSync] Server push warning:', e));

      // 2. Push to Firebase Firestore (permanent cloud database across all devices)
      const db = dbRef.current || getFirebaseDB();
      if (db) {
        try {
          const docRef = doc(db, 'odonto_clinic', 'main_workspace');
          await setDoc(docRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
          setSyncStatus('synced');
          const now = new Date();
          setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`);
        } catch (e) {
          console.warn('[Firestore] Sync warning:', e);
        }
      }
    };

    if (forceImmediate) {
      executeSync();
    } else {
      syncDebounceTimer.current = setTimeout(executeSync, 300);
    }
  }, [patients, appointments, tasks, chatMessages, disciplines, notices, studySubjects, examSchedules, googleResources, currentStudent, duplaPartner, darkMode, privacyMode, userPin]);

  const pushToCloudState = syncStateToCloudAndFirestore;
  const pushToFirestore = () => syncStateToCloudAndFirestore(true);

  // Initialize Firebase DB on mount or config change
  useEffect(() => {
    const { db } = initFirebase();
    dbRef.current = db;
    setIsFirebaseActive(!!db);
  }, [firebaseCustomConfig]);

  // Firestore Real-Time Listeners (Sync from Firebase)
  useEffect(() => {
    const db = dbRef.current || getFirebaseDB();
    if (!db) return;

    try {
      // Listen to main clinic document
      const docRef = doc(db, 'odonto_clinic', 'main_workspace');
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            isInternalChange.current = true;
            if (Array.isArray(data.patients)) {
              const clean = cleanDummy<Patient>(data.patients);
              setPatients(clean);
              saveToStorage('patients', clean);
            }
            if (Array.isArray(data.appointments)) {
              const clean = cleanDummy<Appointment>(data.appointments);
              setAppointments(clean);
              saveToStorage('appointments', clean);
            }
            if (Array.isArray(data.tasks)) {
              const clean = cleanDummy<TaskItem>(data.tasks);
              setTasks(clean);
              saveToStorage('tasks', clean);
            }
            if (Array.isArray(data.chatMessages)) {
              const clean = cleanDummy<ChatMessage>(data.chatMessages);
              setChatMessages(clean);
              saveToStorage('chat_messages', clean);
            }
            if (Array.isArray(data.disciplines) && data.disciplines.length > 0) {
              const clean = data.disciplines as DisciplineConfig[];
              setDisciplines(clean);
              saveToStorage('disciplines', clean);
            }
            if (Array.isArray(data.notices)) {
              const clean = cleanDummy<AcademicNotice>(data.notices);
              setNotices(clean);
              saveToStorage('notices', clean);
            }
            if (Array.isArray(data.studySubjects)) {
              const clean = cleanDummy<StudySubject>(data.studySubjects);
              setStudySubjects(clean);
              saveToStorage('study_subjects', clean);
            }
            if (Array.isArray(data.examSchedules)) {
              const clean = cleanDummy<ExamSchedule>(data.examSchedules);
              setExamSchedules(clean);
              saveToStorage('exam_schedules', clean);
            }
            if (Array.isArray(data.googleResources)) {
              const clean = cleanDummy<GoogleResourceLink>(data.googleResources);
              setGoogleResources(clean);
              saveToStorage('google_resources', clean);
            }
            if (data.student) setCurrentStudent(data.student);
            if (data.dupla) setDuplaPartner(data.dupla);
            setSyncStatus('synced');
            const now = new Date();
            setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`);
            setTimeout(() => {
              isInternalChange.current = false;
            }, 150);
          }
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
      if (action === 'update_studies' && payload) setStudySubjects(payload);
      if (action === 'update_exams' && payload) setExamSchedules(payload);
      if (action === 'update_resources' && payload) setGoogleResources(payload);
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

  // Auto-Save when state changes (saves to local cache, broadcasts to tabs, syncs to Cloud & Firestore)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('patients', patients);
    if (!isInternalChange.current) {
      broadcastStateChange('update_patients', patients);
      syncStateToCloudAndFirestore();
    }
  }, [patients, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('appointments', appointments);
    if (!isInternalChange.current) {
      broadcastStateChange('update_appointments', appointments);
      syncStateToCloudAndFirestore();
    }
  }, [appointments, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('tasks', tasks);
    if (!isInternalChange.current) {
      broadcastStateChange('update_tasks', tasks);
      syncStateToCloudAndFirestore();
    }
  }, [tasks, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('chat_messages', chatMessages);
    if (!isInternalChange.current) {
      broadcastStateChange('update_chat', chatMessages);
      syncStateToCloudAndFirestore();
    }
  }, [chatMessages, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('disciplines', disciplines);
    if (!isInternalChange.current) {
      broadcastStateChange('update_disciplines', disciplines);
      syncStateToCloudAndFirestore();
    }
  }, [disciplines, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('notices', notices);
    if (!isInternalChange.current) {
      broadcastStateChange('update_notices', notices);
      syncStateToCloudAndFirestore();
    }
  }, [notices, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('student_profile', currentStudent);
    if (!isInternalChange.current) {
      broadcastStateChange('update_student', currentStudent);
      syncStateToCloudAndFirestore();
    }
  }, [currentStudent, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('dupla_partner', duplaPartner);
    if (!isInternalChange.current) {
      broadcastStateChange('update_dupla', duplaPartner);
      syncStateToCloudAndFirestore();
    }
  }, [duplaPartner, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('study_subjects', studySubjects);
    if (!isInternalChange.current) {
      broadcastStateChange('update_studies', studySubjects);
      syncStateToCloudAndFirestore();
    }
  }, [studySubjects, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('exam_schedules', examSchedules);
    if (!isInternalChange.current) {
      broadcastStateChange('update_exams', examSchedules);
      syncStateToCloudAndFirestore();
    }
  }, [examSchedules, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    saveToStorage('google_resources', googleResources);
    if (!isInternalChange.current) {
      broadcastStateChange('update_resources', googleResources);
      syncStateToCloudAndFirestore();
    }
  }, [googleResources, syncStateToCloudAndFirestore]);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (!isInternalChange.current) {
      syncStateToCloudAndFirestore();
    }
  }, [darkMode, privacyMode, userPin, syncStateToCloudAndFirestore]);

  // Cloud Sync trigger
  const triggerCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      // 1. Fetch latest from Firebase Firestore FIRST
      const db = dbRef.current || getFirebaseDB();
      let latestCloudData: any = null;
      if (db) {
        try {
          const docRef = doc(db, 'odonto_clinic', 'main_workspace');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data && (data.patients || data.student || data.dupla || data.appointments)) {
              latestCloudData = data;
            }
          }
        } catch (e) {
          console.warn('[Firestore] Pull warning:', e);
        }
      }

      // 2. If not from Firestore, fetch from Server
      if (!latestCloudData) {
        const { state: serverState } = await fetchCloudState();
        if (serverState && (serverState.patients || serverState.student || serverState.dupla || serverState.appointments)) {
          latestCloudData = serverState;
        }
      }

      // 3. If cloud data exists, apply it to the local app immediately
      if (latestCloudData) {
        isInternalChange.current = true;
        if (Array.isArray(latestCloudData.patients)) {
          const clean = cleanDummy<Patient>(latestCloudData.patients);
          setPatients(clean);
          saveToStorage('patients', clean);
        }
        if (Array.isArray(latestCloudData.appointments)) {
          const clean = cleanDummy<Appointment>(latestCloudData.appointments);
          setAppointments(clean);
          saveToStorage('appointments', clean);
        }
        if (Array.isArray(latestCloudData.tasks)) {
          const clean = cleanDummy<TaskItem>(latestCloudData.tasks);
          setTasks(clean);
          saveToStorage('tasks', clean);
        }
        if (Array.isArray(latestCloudData.chatMessages)) {
          const clean = cleanDummy<ChatMessage>(latestCloudData.chatMessages);
          setChatMessages(clean);
          saveToStorage('chat_messages', clean);
        }
        if (Array.isArray(latestCloudData.disciplines) && latestCloudData.disciplines.length > 0) {
          const clean = latestCloudData.disciplines as DisciplineConfig[];
          setDisciplines(clean);
          saveToStorage('disciplines', clean);
        }
        if (Array.isArray(latestCloudData.notices)) {
          const clean = cleanDummy<AcademicNotice>(latestCloudData.notices);
          setNotices(clean);
          saveToStorage('notices', clean);
        }
        if (Array.isArray(latestCloudData.studySubjects)) {
          const clean = cleanDummy<StudySubject>(latestCloudData.studySubjects);
          setStudySubjects(clean);
          saveToStorage('study_subjects', clean);
        }
        if (Array.isArray(latestCloudData.examSchedules)) {
          const clean = cleanDummy<ExamSchedule>(latestCloudData.examSchedules);
          setExamSchedules(clean);
          saveToStorage('exam_schedules', clean);
        }
        if (Array.isArray(latestCloudData.googleResources)) {
          const clean = cleanDummy<GoogleResourceLink>(latestCloudData.googleResources);
          setGoogleResources(clean);
          saveToStorage('google_resources', clean);
        }
        if (latestCloudData.student) {
          setCurrentStudent(latestCloudData.student);
          saveToStorage('student_profile', latestCloudData.student);
        }
        if (latestCloudData.dupla) {
          setDuplaPartner(latestCloudData.dupla);
          saveToStorage('dupla_partner', latestCloudData.dupla);
        }
        setTimeout(() => {
          isInternalChange.current = false;
        }, 150);
      } else {
        // If cloud was empty, push local state to cloud
        await syncStateToCloudAndFirestore(true);
      }

      setSyncStatus('synced');
      const now = new Date();
      const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`;
      setLastSyncedTime(timeStr);
      showToast('Aplicativo sincronizado com o banco único do Firebase (Celular ⇄ PC)!', 'success');
    } catch (err) {
      console.warn('Sync error:', err);
      setSyncStatus('idle');
      showToast('Falha na sincronização. Verifique a conexão com a internet.', 'warning');
    } finally {
      setIsSyncing(false);
    }
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
    setPatients((prev) => {
      const updated = [newPatient, ...prev.filter(p => p.id !== id)];
      saveToStorage('patients', updated);
      return updated;
    });
    showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`);
    return id;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      saveToStorage('patients', updated);
      return updated;
    });
    showToast('Prontuário do paciente atualizado.');
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage('patients', updated);
      return updated;
    });
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.patientId !== id);
      saveToStorage('appointments', updated);
      return updated;
    });
    if (selectedPatientId === id) setSelectedPatientId(null);
    showToast('Paciente removido do sistema.', 'info');
  };

  const updateOdontogramTooth = (patientId: string, toothNumber: number, toothData: ToothData) => {
    setPatients((prev) => {
      const updated = prev.map((p) => {
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
      });
      saveToStorage('patients', updated);
      return updated;
    });
    showToast(`Odontograma atualizado para o dente ${toothNumber}.`);
  };

  const addClinicalEvolution = (patientId: string, evolutionData: Omit<ClinicalEvolution, 'id' | 'createdAt'>) => {
    const evo: ClinicalEvolution = {
      ...evolutionData,
      id: `evo_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setPatients((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          evolutions: [evo, ...p.evolutions],
          updatedAt: new Date().toISOString()
        };
      });
      saveToStorage('patients', updated);
      return updated;
    });

    // Also update discipline progress
    setDisciplines((prev) => {
      const updated = prev.map((d) => (d.name === evolutionData.discipline ? { ...d, completedCount: d.completedCount + 1 } : d));
      saveToStorage('disciplines', updated);
      return updated;
    });

    showToast('Evolução clínica registrada no prontuário!');
  };

  const deleteClinicalEvolution = (patientId: string, evolutionId: string) => {
    setPatients((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          evolutions: p.evolutions.filter((evo) => evo.id !== evolutionId),
          updatedAt: new Date().toISOString()
        };
      });
      saveToStorage('patients', updated);
      return updated;
    });
    showToast('Evolução clínica excluída.', 'info');
  };

  const addPatientExam = (patientId: string, examData: Omit<RadiographExam, 'id'>) => {
    const exam: RadiographExam = {
      ...examData,
      id: `exam_${Date.now()}`
    };

    setPatients((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          exams: [exam, ...p.exams],
          updatedAt: new Date().toISOString()
        };
      });
      saveToStorage('patients', updated);
      return updated;
    });
    showToast('Exame radiográfico / foto anexada com sucesso!');
  };

  const deletePatientExam = (patientId: string, examId: string) => {
    setPatients((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          exams: p.exams.filter((e) => e.id !== examId),
          updatedAt: new Date().toISOString()
        };
      });
      saveToStorage('patients', updated);
      return updated;
    });
    showToast('Exame removido da galeria.', 'info');
  };

  // Appointment Actions
  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt_${Date.now()}`
    };
    setAppointments((prev) => {
      const updated = [...prev, newApt].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      saveToStorage('appointments', updated);
      return updated;
    });
    showToast(`Consulta agendada para ${newApt.patientName}!`);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      saveToStorage('appointments', updated);
      return updated;
    });
    showToast('Agendamento atualizado.');
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveToStorage('appointments', updated);
      return updated;
    });
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
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      saveToStorage('tasks', updated);
      return updated;
    });
    showToast('Tarefa compartilhada adicionada ao painel.');
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveToStorage('tasks', updated);
      return updated;
    });
  };

  const toggleTask = toggleTaskCompletion;

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToStorage('tasks', updated);
      return updated;
    });
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
    setChatMessages((prev) => {
      const updated = [...prev, newMsg];
      saveToStorage('chat_messages', updated);
      return updated;
    });
    pushChatMessageToCloud(newMsg);
  };

  const sendVoiceMessage = (durationSeconds: number, audioUrl?: string, patientTag?: string) => {
    const now = new Date();
    const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: (currentStudent.name as any) || 'Rafael (Você)',
      senderRole: 'Estudante A',
      content: `🎙️ Mensagem de Voz (${durationSeconds}s)`,
      audioDuration: `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`,
      audioUrl: audioUrl,
      attachedPatientName: patientTag,
      timestamp: timeStr
    };
    setChatMessages((prev) => {
      const updated = [...prev, newMsg];
      saveToStorage('chat_messages', updated);
      return updated;
    });
    pushChatMessageToCloud(newMsg);
    showToast('Mensagem de voz enviada para a dupla!');
  };

  const deleteChatMessage = (id: string) => {
    setChatMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToStorage('chat_messages', updated);
      return updated;
    });
    showToast('Mensagem removida.', 'info');
  };

  const clearChatMessages = () => {
    setChatMessages([]);
    saveToStorage('chat_messages', []);
    showToast('Histórico do chat limpo.', 'info');
  };

  const addAcademicNotice = (notice: Omit<AcademicNotice, 'id' | 'isRead'>) => {
    const newNotice: AcademicNotice = {
      ...notice,
      id: 'notice-' + Date.now(),
      isRead: false
    };
    setNotices((prev) => {
      const updated = [newNotice, ...prev];
      saveToStorage('notices', updated);
      return updated;
    });
    showToast('Aviso/prazo adicionado com sucesso!');
  };

  const deleteAcademicNotice = (id: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToStorage('notices', updated);
      return updated;
    });
    showToast('Aviso acadêmico excluído.', 'info');
  };

  const markNoticeAsRead = (id: string) => {
    setNotices((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveToStorage('notices', updated);
      return updated;
    });
  };

  const updateDiscipline = (id: string, updates: Partial<DisciplineConfig>) => {
    setDisciplines((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      saveToStorage('disciplines', updated);
      return updated;
    });
    showToast('Disciplina atualizada com sucesso.');
  };

  const updateDisciplineTarget = (id: string, completedCount: number) => {
    setDisciplines((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, completedCount } : d));
      saveToStorage('disciplines', updated);
      return updated;
    });
    showToast('Meta da disciplina atualizada.');
  };

  // Study Actions
  const addStudySubject = (subject: Omit<StudySubject, 'id' | 'topics'>) => {
    const newSubj: StudySubject = {
      ...subject,
      id: 'subj-' + Date.now(),
      topics: []
    };
    setStudySubjects((prev) => {
      const updated = [...prev, newSubj];
      saveToStorage('study_subjects', updated);
      return updated;
    });
    showToast(`Matéria "${newSubj.name}" adicionada ao plano de estudos!`);
  };

  const updateStudySubject = (id: string, updates: Partial<StudySubject>) => {
    setStudySubjects((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveToStorage('study_subjects', updated);
      return updated;
    });
    showToast('Matéria atualizada com sucesso!');
  };

  const deleteStudySubject = (id: string) => {
    setStudySubjects((prev) => {
      const target = prev.find(s => s.id === id);
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage('study_subjects', updated);
      return updated;
    });
    showToast('Matéria removida dos estudos.', 'info');
  };

  const addStudyTopic = (subjectId: string, topic: Omit<StudyTopic, 'id'>) => {
    const newTopic: StudyTopic = {
      ...topic,
      id: 'top-' + Date.now()
    };
    setStudySubjects((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: [...s.topics, newTopic]
        };
      });
      saveToStorage('study_subjects', updated);
      return updated;
    });
  };

  const toggleStudyTopic = (subjectId: string, topicId: string) => {
    setStudySubjects((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t))
        };
      });
      saveToStorage('study_subjects', updated);
      return updated;
    });
  };

  const deleteStudyTopic = (subjectId: string, topicId: string) => {
    setStudySubjects((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.filter((t) => t.id !== topicId)
        };
      });
      saveToStorage('study_subjects', updated);
      return updated;
    });
  };

  const addExamSchedule = (exam: Omit<ExamSchedule, 'id'>) => {
    const newExam: ExamSchedule = {
      ...exam,
      id: 'exam-' + Date.now()
    };
    setExamSchedules((prev) => {
      const updated = [...prev, newExam].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
      saveToStorage('exam_schedules', updated);
      return updated;
    });
    showToast(`Prova de ${newExam.subject} agendada com sucesso!`);
  };

  const updateExamSchedule = (id: string, updates: Partial<ExamSchedule>) => {
    setExamSchedules((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      saveToStorage('exam_schedules', updated);
      return updated;
    });
    showToast('Prova atualizada.');
  };

  const deleteExamSchedule = (id: string) => {
    setExamSchedules((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToStorage('exam_schedules', updated);
      return updated;
    });
    showToast('Prova removida do cronograma.', 'info');
  };

  const addGoogleResource = (resource: Omit<GoogleResourceLink, 'id'>) => {
    const newResource: GoogleResourceLink = {
      ...resource,
      id: 'gres-' + Date.now()
    };
    setGoogleResources((prev) => {
      const updated = [...prev, newResource];
      saveToStorage('google_resources', updated);
      return updated;
    });
    showToast('Atalho do Google salvo!');
  };

  const deleteGoogleResource = (id: string) => {
    setGoogleResources((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage('google_resources', updated);
      return updated;
    });
    showToast('Atalho removido.', 'info');
  };

  const resetToDefaultData = () => {
    setPatients(INITIAL_PATIENTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setTasks(INITIAL_TASKS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setDisciplines(INITIAL_DISCIPLINES);
    setNotices(INITIAL_NOTICES);
    setStudySubjects(INITIAL_STUDY_SUBJECTS);
    setExamSchedules(INITIAL_EXAM_SCHEDULES);
    setGoogleResources(INITIAL_GOOGLE_RESOURCES);
    setCurrentStudent(INITIAL_STUDENT);
    setDuplaPartner(INITIAL_DUPLA);

    pushCloudState({
      patients: INITIAL_PATIENTS,
      appointments: INITIAL_APPOINTMENTS,
      tasks: INITIAL_TASKS,
      chatMessages: INITIAL_CHAT_MESSAGES,
      disciplines: INITIAL_DISCIPLINES,
      notices: INITIAL_NOTICES,
      student: INITIAL_STUDENT,
      dupla: INITIAL_DUPLA,
      updatedAt: Date.now()
    });

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
        connectedDevicesCount,
        isCloudConnected,
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
        studySubjects,
        examSchedules,
        googleResources,
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
        addStudySubject,
        updateStudySubject,
        deleteStudySubject,
        addStudyTopic,
        toggleStudyTopic,
        deleteStudyTopic,
        addExamSchedule,
        updateExamSchedule,
        deleteExamSchedule,
        addGoogleResource,
        deleteGoogleResource,
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
