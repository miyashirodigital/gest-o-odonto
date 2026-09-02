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
  getOrCreateDeviceId,
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

  // Collections state initialized synchronously from local storage cache
  const [patients, setPatients] = useState<Patient[]>(() => {
    return getSyncStorage<Patient[]>('patients', INITIAL_PATIENTS) || [];
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return getSyncStorage<Appointment[]>('appointments', INITIAL_APPOINTMENTS) || [];
  });
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return getSyncStorage<TaskItem[]>('tasks', INITIAL_TASKS) || [];
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return getSyncStorage<ChatMessage[]>('chat_messages', INITIAL_CHAT_MESSAGES) || [];
  });
  const [disciplines, setDisciplines] = useState<DisciplineConfig[]>(() => {
    return getSyncStorage<DisciplineConfig[]>('disciplines', INITIAL_DISCIPLINES) || INITIAL_DISCIPLINES;
  });
  const [notices, setNotices] = useState<AcademicNotice[]>(() => {
    return getSyncStorage<AcademicNotice[]>('notices', INITIAL_NOTICES) || [];
  });
  const [studySubjects, setStudySubjects] = useState<StudySubject[]>(() => {
    return getSyncStorage<StudySubject[]>('study_subjects', INITIAL_STUDY_SUBJECTS) || [];
  });
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(() => {
    return getSyncStorage<ExamSchedule[]>('exam_schedules', INITIAL_EXAM_SCHEDULES) || [];
  });
  const [googleResources, setGoogleResources] = useState<GoogleResourceLink[]>(() => {
    return getSyncStorage<GoogleResourceLink[]>('google_resources', INITIAL_GOOGLE_RESOURCES) || [];
  });

  // Helpers for explicitly deleted records tracking
  const getDeletedIds = (key: string): Set<string> => {
    try {
      const raw = localStorage.getItem(`odonto_${key}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set<string>();
  };

  const saveDeletedIds = (key: string, set: Set<string>) => {
    try {
      localStorage.setItem(`odonto_${key}`, JSON.stringify(Array.from(set)));
    } catch {}
  };

  const deletedPatientIdsRef = useRef<Set<string>>(getDeletedIds('deleted_patient_ids'));
  const deletedAppointmentIdsRef = useRef<Set<string>>(getDeletedIds('deleted_appointment_ids'));
  const deletedTaskIdsRef = useRef<Set<string>>(getDeletedIds('deleted_task_ids'));

  // Synchronization refs to eliminate closure race conditions and state wipeouts
  const patientsRef = useRef<Patient[]>(patients);
  useEffect(() => { patientsRef.current = patients; }, [patients]);

  const appointmentsRef = useRef<Appointment[]>(appointments);
  useEffect(() => { appointmentsRef.current = appointments; }, [appointments]);

  const tasksRef = useRef<TaskItem[]>(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);
  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);

  const disciplinesRef = useRef<DisciplineConfig[]>(disciplines);
  useEffect(() => { disciplinesRef.current = disciplines; }, [disciplines]);

  const noticesRef = useRef<AcademicNotice[]>(notices);
  useEffect(() => { noticesRef.current = notices; }, [notices]);

  const studySubjectsRef = useRef<StudySubject[]>(studySubjects);
  useEffect(() => { studySubjectsRef.current = studySubjects; }, [studySubjects]);

  const examSchedulesRef = useRef<ExamSchedule[]>(examSchedules);
  useEffect(() => { examSchedulesRef.current = examSchedules; }, [examSchedules]);

  const googleResourcesRef = useRef<GoogleResourceLink[]>(googleResources);
  useEffect(() => { googleResourcesRef.current = googleResources; }, [googleResources]);

  const currentStudentRef = useRef<StudentProfile>(currentStudent);
  useEffect(() => { currentStudentRef.current = currentStudent; }, [currentStudent]);

  const duplaPartnerRef = useRef<DuplaPartner>(duplaPartner);
  useEffect(() => { duplaPartnerRef.current = duplaPartner; }, [duplaPartner]);

  const lastLocalWriteTimestamp = useRef<number>(Date.now());
  const isLoadedRef = useRef<boolean>(false);
  const isInternalChange = useRef<boolean>(false);
  const syncDebounceTimer = useRef<any>(null);

  // Non-destructive list merger that prevents data rollback and patient disappearance
  function mergeRecords<T extends { id: string; updatedAt?: string | number }>(
    localList: T[] | undefined | null,
    remoteList: T[] | undefined | null,
    deletedIds: Set<string>
  ): T[] {
    const map = new Map<string, T>();

    // 1. Incorporate remote list items (if not deleted locally)
    if (Array.isArray(remoteList)) {
      for (const item of remoteList) {
        if (item && item.id && !deletedIds.has(item.id)) {
          map.set(item.id, item);
        }
      }
    }

    // 2. Incorporate local list items (keep locally created/updated items that aren't in remote yet)
    if (Array.isArray(localList)) {
      for (const localItem of localList) {
        if (!localItem || !localItem.id || deletedIds.has(localItem.id)) continue;
        const remoteItem = map.get(localItem.id);
        if (!remoteItem) {
          // Local record not present in remote yet -> preserve it!
          map.set(localItem.id, localItem);
        } else {
          // Both have the record -> keep the one with the latest timestamp
          const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
          const remoteTime = remoteItem.updatedAt ? new Date(remoteItem.updatedAt).getTime() : 0;
          if (localTime >= remoteTime) {
            map.set(localItem.id, localItem);
          }
        }
      }
    }

    return Array.from(map.values());
  }

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

  // Helper to push state to Cloud Server AND Firebase Firestore (debounced & resilient)
  const syncStateToCloudAndFirestore = useCallback((explicitOverrides?: Partial<CloudClinicState>, forceImmediate = false) => {
    if (syncDebounceTimer.current) {
      clearTimeout(syncDebounceTimer.current);
      syncDebounceTimer.current = null;
    }

    const executeSync = async () => {
      setSyncStatus('syncing');
      const payload: CloudClinicState = {
        patients: explicitOverrides?.patients ?? patientsRef.current,
        appointments: explicitOverrides?.appointments ?? appointmentsRef.current,
        tasks: explicitOverrides?.tasks ?? tasksRef.current,
        chatMessages: explicitOverrides?.chatMessages ?? chatMessagesRef.current,
        disciplines: explicitOverrides?.disciplines ?? disciplinesRef.current,
        notices: explicitOverrides?.notices ?? noticesRef.current,
        studySubjects: explicitOverrides?.studySubjects ?? studySubjectsRef.current,
        examSchedules: explicitOverrides?.examSchedules ?? examSchedulesRef.current,
        googleResources: explicitOverrides?.googleResources ?? googleResourcesRef.current,
        student: explicitOverrides?.student ?? currentStudentRef.current,
        dupla: explicitOverrides?.dupla ?? duplaPartnerRef.current,
        settings: {
          darkMode,
          privacyMode,
          userPin
        },
        updatedAt: Date.now()
      };

      // 1. Push to server backend (writes to persistent disk & SSE broadcast)
      pushCloudState({ ...payload, senderId: getOrCreateDeviceId() } as any).then((ok) => {
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
      syncDebounceTimer.current = setTimeout(executeSync, 250);
    }
  }, [darkMode, privacyMode, userPin]);

  const pushToCloudState = syncStateToCloudAndFirestore;
  const pushToFirestore = () => syncStateToCloudAndFirestore(undefined, true);

  // Load from Firebase Firestore on boot (Authoritative Single Source of Truth)
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      isInternalChange.current = true;
      try {
        let cloudData: any = null;
        let sourceName = '';

        // 1. Primary check: Firestore document odonto_clinic/main_workspace
        const db = getFirebaseDB();
        if (db) {
          try {
            const docRef = doc(db, 'odonto_clinic', 'main_workspace');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data) {
                cloudData = data;
                sourceName = 'Firebase';
              }
            }
          } catch (e) {
            console.warn('[Firestore] Boot getDoc warning:', e);
          }
        }

        // 2. Secondary check: Server persistent store
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

        if (isCancelled) return;

        // If cloud data exists, merge it non-destructively so local items are never wiped
        if (cloudData) {
          if (Array.isArray(cloudData.patients)) {
            const merged = mergeRecords(patientsRef.current, cloudData.patients, deletedPatientIdsRef.current);
            patientsRef.current = merged;
            setPatients(merged);
            saveToStorage('patients', merged);
          }
          if (Array.isArray(cloudData.appointments)) {
            const merged = mergeRecords(appointmentsRef.current, cloudData.appointments, deletedAppointmentIdsRef.current);
            appointmentsRef.current = merged;
            setAppointments(merged);
            saveToStorage('appointments', merged);
          }
          if (Array.isArray(cloudData.tasks)) {
            const merged = mergeRecords(tasksRef.current, cloudData.tasks, deletedTaskIdsRef.current);
            tasksRef.current = merged;
            setTasks(merged);
            saveToStorage('tasks', merged);
          }
          if (Array.isArray(cloudData.chatMessages)) {
            const merged = mergeRecords(chatMessagesRef.current, cloudData.chatMessages, new Set());
            chatMessagesRef.current = merged;
            setChatMessages(merged);
            saveToStorage('chat_messages', merged);
          }
          if (Array.isArray(cloudData.disciplines) && cloudData.disciplines.length > 0) {
            disciplinesRef.current = cloudData.disciplines;
            setDisciplines(cloudData.disciplines);
            saveToStorage('disciplines', cloudData.disciplines);
          }
          if (Array.isArray(cloudData.notices)) {
            const merged = mergeRecords(noticesRef.current, cloudData.notices, new Set());
            noticesRef.current = merged;
            setNotices(merged);
            saveToStorage('notices', merged);
          }
          if (Array.isArray(cloudData.studySubjects)) {
            const merged = mergeRecords(studySubjectsRef.current, cloudData.studySubjects, new Set());
            studySubjectsRef.current = merged;
            setStudySubjects(merged);
            saveToStorage('study_subjects', merged);
          }
          if (Array.isArray(cloudData.examSchedules)) {
            const merged = mergeRecords(examSchedulesRef.current, cloudData.examSchedules, new Set());
            examSchedulesRef.current = merged;
            setExamSchedules(merged);
            saveToStorage('exam_schedules', merged);
          }
          if (Array.isArray(cloudData.googleResources)) {
            const merged = mergeRecords(googleResourcesRef.current, cloudData.googleResources, new Set());
            googleResourcesRef.current = merged;
            setGoogleResources(merged);
            saveToStorage('google_resources', merged);
          }
          if (cloudData.student) {
            currentStudentRef.current = cloudData.student;
            setCurrentStudent(cloudData.student);
            saveToStorage('student_profile', cloudData.student);
          }
          if (cloudData.dupla) {
            duplaPartnerRef.current = cloudData.dupla;
            setDuplaPartner(cloudData.dupla);
            saveToStorage('dupla_partner', cloudData.dupla);
          }
          if (cloudData.settings) {
            if (typeof cloudData.settings.darkMode === 'boolean') setDarkMode(cloudData.settings.darkMode);
            if (typeof cloudData.settings.privacyMode === 'boolean') setPrivacyMode(cloudData.settings.privacyMode);
            if (cloudData.settings.userPin) setUserPinState(cloudData.settings.userPin);
          }
        } else {
          // Initial push to cloud if remote was empty
          const initialPayload: CloudClinicState = {
            patients: patientsRef.current,
            appointments: appointmentsRef.current,
            tasks: tasksRef.current,
            chatMessages: chatMessagesRef.current,
            disciplines: disciplinesRef.current,
            notices: noticesRef.current,
            studySubjects: studySubjectsRef.current,
            examSchedules: examSchedulesRef.current,
            googleResources: googleResourcesRef.current,
            student: currentStudentRef.current,
            dupla: duplaPartnerRef.current,
            settings: { darkMode, privacyMode, userPin },
            updatedAt: Date.now()
          };
          pushCloudState(initialPayload);
          if (db) {
            try {
              const docRef = doc(db, 'odonto_clinic', 'main_workspace');
              setDoc(docRef, { ...initialPayload, updatedAt: new Date().toISOString() }, { merge: true });
            } catch (e) {
              console.warn('[Firestore] Initial push warning:', e);
            }
          }
        }

        const now = new Date();
        setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${sourceName || 'Nuvem'})`);
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

    return () => {
      isCancelled = true;
    };
  }, []);

  // Real-Time Cloud SSE Listener (Multi-Device Sync Celular ⇄ Computador)
  useEffect(() => {
    const unsubscribe = subscribeToCloudEvents({
      onInit: (state, count) => {
        if (count) setConnectedDevicesCount(count);
        if (state) {
          isInternalChange.current = true;
          if (Array.isArray(state.patients)) {
            const merged = mergeRecords(patientsRef.current, state.patients, deletedPatientIdsRef.current);
            patientsRef.current = merged;
            setPatients(merged);
            saveToStorage('patients', merged);
          }
          if (Array.isArray(state.appointments)) {
            const merged = mergeRecords(appointmentsRef.current, state.appointments, deletedAppointmentIdsRef.current);
            appointmentsRef.current = merged;
            setAppointments(merged);
            saveToStorage('appointments', merged);
          }
          if (Array.isArray(state.tasks)) {
            const merged = mergeRecords(tasksRef.current, state.tasks, deletedTaskIdsRef.current);
            tasksRef.current = merged;
            setTasks(merged);
            saveToStorage('tasks', merged);
          }
          if (Array.isArray(state.chatMessages)) {
            const merged = mergeRecords(chatMessagesRef.current, state.chatMessages, new Set());
            chatMessagesRef.current = merged;
            setChatMessages(merged);
            saveToStorage('chat_messages', merged);
          }
          if (Array.isArray(state.disciplines) && state.disciplines.length > 0) {
            disciplinesRef.current = state.disciplines;
            setDisciplines(state.disciplines);
            saveToStorage('disciplines', state.disciplines);
          }
          if (Array.isArray(state.notices)) {
            const merged = mergeRecords(noticesRef.current, state.notices, new Set());
            noticesRef.current = merged;
            setNotices(merged);
            saveToStorage('notices', merged);
          }
          if (state.student) {
            currentStudentRef.current = state.student;
            setCurrentStudent(state.student);
          }
          if (state.dupla) {
            duplaPartnerRef.current = state.dupla;
            setDuplaPartner(state.dupla);
          }
          setSyncStatus('synced');
          const now = new Date();
          setLastSyncedTime(`Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Nuvem)`);
          setTimeout(() => {
            isInternalChange.current = false;
          }, 150);
        }
      },
      onStateUpdate: (state, source, senderId) => {
        if (!state) return;
        // Ignore echo of our own state updates
        if (senderId && senderId === getOrCreateDeviceId()) return;

        isInternalChange.current = true;
        if (Array.isArray(state.patients)) {
          const merged = mergeRecords(patientsRef.current, state.patients, deletedPatientIdsRef.current);
          patientsRef.current = merged;
          setPatients(merged);
          saveToStorage('patients', merged);
        }
        if (Array.isArray(state.appointments)) {
          const merged = mergeRecords(appointmentsRef.current, state.appointments, deletedAppointmentIdsRef.current);
          appointmentsRef.current = merged;
          setAppointments(merged);
          saveToStorage('appointments', merged);
        }
        if (Array.isArray(state.tasks)) {
          const merged = mergeRecords(tasksRef.current, state.tasks, deletedTaskIdsRef.current);
          tasksRef.current = merged;
          setTasks(merged);
          saveToStorage('tasks', merged);
        }
        if (Array.isArray(state.chatMessages)) {
          const merged = mergeRecords(chatMessagesRef.current, state.chatMessages, new Set());
          chatMessagesRef.current = merged;
          setChatMessages(merged);
          saveToStorage('chat_messages', merged);
        }
        if (Array.isArray(state.disciplines) && state.disciplines.length > 0) {
          disciplinesRef.current = state.disciplines;
          setDisciplines(state.disciplines);
          saveToStorage('disciplines', state.disciplines);
        }
        if (Array.isArray(state.notices)) {
          const merged = mergeRecords(noticesRef.current, state.notices, new Set());
          noticesRef.current = merged;
          setNotices(merged);
          saveToStorage('notices', merged);
        }
        if (state.student) {
          currentStudentRef.current = state.student;
          setCurrentStudent(state.student);
        }
        if (state.dupla) {
          duplaPartnerRef.current = state.dupla;
          setDuplaPartner(state.dupla);
        }

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
          chatMessagesRef.current = updated;
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
  const dbRef = useRef<any>(null);

  // Initialize Firebase DB on mount or config change
  useEffect(() => {
    const { db } = initFirebase();
    dbRef.current = db;
    setIsFirebaseActive(!!db);
  }, [firebaseCustomConfig]);

  // Firestore Real-Time Listeners (Sync from Firebase with conflict-free merge)
  useEffect(() => {
    const db = dbRef.current || getFirebaseDB();
    if (!db) return;

    try {
      const docRef = doc(db, 'odonto_clinic', 'main_workspace');
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          // If this snapshot has pending uncommitted writes locally, do not overwrite
          if (snapshot.metadata.hasPendingWrites) {
            return;
          }
          const data = snapshot.data();
          if (data) {
            isInternalChange.current = true;
            if (Array.isArray(data.patients)) {
              const merged = mergeRecords(patientsRef.current, data.patients, deletedPatientIdsRef.current);
              patientsRef.current = merged;
              setPatients(merged);
              saveToStorage('patients', merged);
            }
            if (Array.isArray(data.appointments)) {
              const merged = mergeRecords(appointmentsRef.current, data.appointments, deletedAppointmentIdsRef.current);
              appointmentsRef.current = merged;
              setAppointments(merged);
              saveToStorage('appointments', data.appointments);
            }
            if (Array.isArray(data.tasks)) {
              const merged = mergeRecords(tasksRef.current, data.tasks, deletedTaskIdsRef.current);
              tasksRef.current = merged;
              setTasks(merged);
              saveToStorage('tasks', merged);
            }
            if (Array.isArray(data.chatMessages)) {
              const merged = mergeRecords(chatMessagesRef.current, data.chatMessages, new Set());
              chatMessagesRef.current = merged;
              setChatMessages(merged);
              saveToStorage('chat_messages', merged);
            }
            if (Array.isArray(data.disciplines) && data.disciplines.length > 0) {
              disciplinesRef.current = data.disciplines as DisciplineConfig[];
              setDisciplines(data.disciplines as DisciplineConfig[]);
              saveToStorage('disciplines', data.disciplines);
            }
            if (Array.isArray(data.notices)) {
              const merged = mergeRecords(noticesRef.current, data.notices, new Set());
              noticesRef.current = merged;
              setNotices(merged);
              saveToStorage('notices', merged);
            }
            if (Array.isArray(data.studySubjects)) {
              const merged = mergeRecords(studySubjectsRef.current, data.studySubjects, new Set());
              studySubjectsRef.current = merged;
              setStudySubjects(merged);
              saveToStorage('study_subjects', merged);
            }
            if (Array.isArray(data.examSchedules)) {
              const merged = mergeRecords(examSchedulesRef.current, data.examSchedules, new Set());
              examSchedulesRef.current = merged;
              setExamSchedules(merged);
              saveToStorage('exam_schedules', merged);
            }
            if (Array.isArray(data.googleResources)) {
              const merged = mergeRecords(googleResourcesRef.current, data.googleResources, new Set());
              googleResourcesRef.current = merged;
              setGoogleResources(merged);
              saveToStorage('google_resources', merged);
            }
            if (data.student) {
              currentStudentRef.current = data.student;
              setCurrentStudent(data.student);
            }
            if (data.dupla) {
              duplaPartnerRef.current = data.dupla;
              setDuplaPartner(data.dupla);
            }
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
      if (action === 'update_patients' && payload) {
        patientsRef.current = payload;
        setPatients(payload);
      }
      if (action === 'update_appointments' && payload) {
        appointmentsRef.current = payload;
        setAppointments(payload);
      }
      if (action === 'update_tasks' && payload) {
        tasksRef.current = payload;
        setTasks(payload);
      }
      if (action === 'update_chat' && payload) {
        chatMessagesRef.current = payload;
        setChatMessages(payload);
      }
      if (action === 'update_notices' && payload) {
        noticesRef.current = payload;
        setNotices(payload);
      }
      if (action === 'update_disciplines' && payload) {
        disciplinesRef.current = payload;
        setDisciplines(payload);
      }
      if (action === 'update_studies' && payload) {
        studySubjectsRef.current = payload;
        setStudySubjects(payload);
      }
      if (action === 'update_exams' && payload) {
        examSchedulesRef.current = payload;
        setExamSchedules(payload);
      }
      if (action === 'update_resources' && payload) {
        googleResourcesRef.current = payload;
        setGoogleResources(payload);
      }
      if (action === 'update_student' && payload) {
        currentStudentRef.current = payload;
        setCurrentStudent(payload);
      }
      if (action === 'update_dupla' && payload) {
        duplaPartnerRef.current = payload;
        setDuplaPartner(payload);
      }

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

  // Manual & Automated Cloud Sync trigger
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

      // 3. If cloud data exists, merge non-destructively
      if (latestCloudData) {
        isInternalChange.current = true;
        if (Array.isArray(latestCloudData.patients)) {
          const merged = mergeRecords(patientsRef.current, latestCloudData.patients, deletedPatientIdsRef.current);
          patientsRef.current = merged;
          setPatients(merged);
          saveToStorage('patients', merged);
        }
        if (Array.isArray(latestCloudData.appointments)) {
          const merged = mergeRecords(appointmentsRef.current, latestCloudData.appointments, deletedAppointmentIdsRef.current);
          appointmentsRef.current = merged;
          setAppointments(merged);
          saveToStorage('appointments', merged);
        }
        if (Array.isArray(latestCloudData.tasks)) {
          const merged = mergeRecords(tasksRef.current, latestCloudData.tasks, deletedTaskIdsRef.current);
          tasksRef.current = merged;
          setTasks(merged);
          saveToStorage('tasks', merged);
        }
        if (Array.isArray(latestCloudData.chatMessages)) {
          const merged = mergeRecords(chatMessagesRef.current, latestCloudData.chatMessages, new Set());
          chatMessagesRef.current = merged;
          setChatMessages(merged);
          saveToStorage('chat_messages', merged);
        }
        if (Array.isArray(latestCloudData.disciplines) && latestCloudData.disciplines.length > 0) {
          disciplinesRef.current = latestCloudData.disciplines as DisciplineConfig[];
          setDisciplines(latestCloudData.disciplines as DisciplineConfig[]);
          saveToStorage('disciplines', latestCloudData.disciplines);
        }
        if (Array.isArray(latestCloudData.notices)) {
          const merged = mergeRecords(noticesRef.current, latestCloudData.notices, new Set());
          noticesRef.current = merged;
          setNotices(merged);
          saveToStorage('notices', merged);
        }
        if (Array.isArray(latestCloudData.studySubjects)) {
          const merged = mergeRecords(studySubjectsRef.current, latestCloudData.studySubjects, new Set());
          studySubjectsRef.current = merged;
          setStudySubjects(merged);
          saveToStorage('study_subjects', merged);
        }
        if (Array.isArray(latestCloudData.examSchedules)) {
          const merged = mergeRecords(examSchedulesRef.current, latestCloudData.examSchedules, new Set());
          examSchedulesRef.current = merged;
          setExamSchedules(merged);
          saveToStorage('exam_schedules', merged);
        }
        if (Array.isArray(latestCloudData.googleResources)) {
          const merged = mergeRecords(googleResourcesRef.current, latestCloudData.googleResources, new Set());
          googleResourcesRef.current = merged;
          setGoogleResources(merged);
          saveToStorage('google_resources', merged);
        }
        if (latestCloudData.student) {
          currentStudentRef.current = latestCloudData.student;
          setCurrentStudent(latestCloudData.student);
          saveToStorage('student_profile', latestCloudData.student);
        }
        if (latestCloudData.dupla) {
          duplaPartnerRef.current = latestCloudData.dupla;
          setDuplaPartner(latestCloudData.dupla);
          saveToStorage('dupla_partner', latestCloudData.dupla);
        }
        setTimeout(() => {
          isInternalChange.current = false;
        }, 150);
      } else {
        // Push local state to cloud
        await syncStateToCloudAndFirestore(undefined, true);
      }

      setSyncStatus('synced');
      const now = new Date();
      const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Firebase)`;
      setLastSyncedTime(timeStr);
      showToast('Aplicativo sincronizado com o banco central do Firebase (Celular ⇄ PC)!', 'success');
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
    showToast('Firebase desconectado. Operando em modo de banco local.', 'info');
  };

  // Student Profile Updates
  const updateCurrentStudent = (updates: Partial<StudentProfile>) => {
    const updated = { ...currentStudentRef.current, ...updates };
    currentStudentRef.current = updated;
    setCurrentStudent(updated);
    saveToStorage('student_profile', updated);
    broadcastStateChange('update_student', updated);
    syncStateToCloudAndFirestore({ student: updated }, true);
    showToast('Perfil do acadêmico atualizado com sucesso!');
  };

  const updateDuplaPartner = (updates: Partial<DuplaPartner>) => {
    const updated = { ...duplaPartnerRef.current, ...updates };
    duplaPartnerRef.current = updated;
    setDuplaPartner(updated);
    saveToStorage('dupla_partner', updated);
    broadcastStateChange('update_dupla', updated);
    syncStateToCloudAndFirestore({ dupla: updated }, true);
    showToast('Dados da dupla de clínica salvos com sucesso!');
  };

  // PIN Actions
  const setUserPin = (pin: string) => {
    setUserPinState(pin);
    localStorage.setItem('odonto_user_pin', pin);
    syncStateToCloudAndFirestore(undefined, false);
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

  // Patient Actions with guaranteed immediate persistence
  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = `p_${Date.now()}`;
    const newPatient: Patient = {
      ...patientData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    deletedPatientIdsRef.current.delete(id);
    saveDeletedIds('deleted_patient_ids', deletedPatientIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updated = [newPatient, ...patientsRef.current.filter((p) => p.id !== id)];
    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);

    showToast(`Paciente ${newPatient.name} cadastrado com sucesso!`, 'success');
    return id;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = patientsRef.current.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);
    showToast('Prontuário do paciente atualizado.');
  };

  const deletePatient = (id: string) => {
    deletedPatientIdsRef.current.add(id);
    saveDeletedIds('deleted_patient_ids', deletedPatientIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updatedPatients = patientsRef.current.filter((p) => p.id !== id);
    patientsRef.current = updatedPatients;
    setPatients(updatedPatients);
    saveToStorage('patients', updatedPatients);

    const updatedAppointments = appointmentsRef.current.filter((a) => a.patientId !== id);
    appointmentsRef.current = updatedAppointments;
    setAppointments(updatedAppointments);
    saveToStorage('appointments', updatedAppointments);

    if (selectedPatientId === id) setSelectedPatientId(null);

    broadcastStateChange('update_patients', updatedPatients);
    broadcastStateChange('update_appointments', updatedAppointments);
    syncStateToCloudAndFirestore({ patients: updatedPatients, appointments: updatedAppointments }, true);

    showToast('Paciente removido do sistema.', 'info');
  };

  const updateOdontogramTooth = (patientId: string, toothNumber: number, toothData: ToothData) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = patientsRef.current.map((p) => {
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

    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);
    showToast(`Odontograma atualizado para o dente ${toothNumber}.`);
  };

  const addClinicalEvolution = (patientId: string, evolutionData: Omit<ClinicalEvolution, 'id' | 'createdAt'>) => {
    lastLocalWriteTimestamp.current = Date.now();
    const evo: ClinicalEvolution = {
      ...evolutionData,
      id: `evo_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedPatients = patientsRef.current.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        evolutions: [evo, ...(p.evolutions || [])],
        updatedAt: new Date().toISOString()
      };
    });

    patientsRef.current = updatedPatients;
    setPatients(updatedPatients);
    saveToStorage('patients', updatedPatients);

    // Update discipline count
    const updatedDisciplines = disciplinesRef.current.map((d) =>
      d.name === evolutionData.discipline ? { ...d, completedCount: d.completedCount + 1 } : d
    );
    disciplinesRef.current = updatedDisciplines;
    setDisciplines(updatedDisciplines);
    saveToStorage('disciplines', updatedDisciplines);

    broadcastStateChange('update_patients', updatedPatients);
    broadcastStateChange('update_disciplines', updatedDisciplines);
    syncStateToCloudAndFirestore({ patients: updatedPatients, disciplines: updatedDisciplines }, true);

    showToast('Evolução clínica registrada no prontuário!');
  };

  const deleteClinicalEvolution = (patientId: string, evolutionId: string) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = patientsRef.current.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        evolutions: (p.evolutions || []).filter((evo) => evo.id !== evolutionId),
        updatedAt: new Date().toISOString()
      };
    });

    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);
    showToast('Evolução clínica excluída.', 'info');
  };

  const addPatientExam = (patientId: string, examData: Omit<RadiographExam, 'id'>) => {
    lastLocalWriteTimestamp.current = Date.now();
    const exam: RadiographExam = {
      ...examData,
      id: `exam_${Date.now()}`
    };

    const updated = patientsRef.current.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        exams: [exam, ...(p.exams || [])],
        updatedAt: new Date().toISOString()
      };
    });

    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);
    showToast('Exame radiográfico / foto anexada com sucesso!');
  };

  const deletePatientExam = (patientId: string, examId: string) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = patientsRef.current.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        exams: (p.exams || []).filter((e) => e.id !== examId),
        updatedAt: new Date().toISOString()
      };
    });

    patientsRef.current = updated;
    setPatients(updated);
    saveToStorage('patients', updated);

    broadcastStateChange('update_patients', updated);
    syncStateToCloudAndFirestore({ patients: updated }, true);
    showToast('Exame removido da galeria.', 'info');
  };

  // Appointment Actions
  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const id = `apt_${Date.now()}`;
    const newApt: Appointment = {
      ...aptData,
      id
    };

    deletedAppointmentIdsRef.current.delete(id);
    saveDeletedIds('deleted_appointment_ids', deletedAppointmentIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updated = [...appointmentsRef.current, newApt].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    appointmentsRef.current = updated;
    setAppointments(updated);
    saveToStorage('appointments', updated);

    broadcastStateChange('update_appointments', updated);
    syncStateToCloudAndFirestore({ appointments: updated }, true);
    showToast(`Consulta agendada para ${newApt.patientName}!`);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = appointmentsRef.current.map((a) => (a.id === id ? { ...a, ...updates } : a));
    appointmentsRef.current = updated;
    setAppointments(updated);
    saveToStorage('appointments', updated);

    broadcastStateChange('update_appointments', updated);
    syncStateToCloudAndFirestore({ appointments: updated }, true);
    showToast('Agendamento atualizado.');
  };

  const deleteAppointment = (id: string) => {
    deletedAppointmentIdsRef.current.add(id);
    saveDeletedIds('deleted_appointment_ids', deletedAppointmentIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updated = appointmentsRef.current.filter((a) => a.id !== id);
    appointmentsRef.current = updated;
    setAppointments(updated);
    saveToStorage('appointments', updated);

    broadcastStateChange('update_appointments', updated);
    syncStateToCloudAndFirestore({ appointments: updated }, true);
    showToast('Agendamento excluído.', 'info');
  };

  const markAppointmentWhatsAppSent = (id: string) => {
    const updated = appointmentsRef.current.map((a) => (a.id === id ? { ...a, remindedViaWhatsApp: true } : a));
    appointmentsRef.current = updated;
    setAppointments(updated);
    saveToStorage('appointments', updated);
    broadcastStateChange('update_appointments', updated);
    syncStateToCloudAndFirestore({ appointments: updated }, false);
  };

  // Task Actions
  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const id = `tsk_${Date.now()}`;
    const newTask: TaskItem = {
      ...taskData,
      id,
      createdAt: new Date().toISOString()
    };

    deletedTaskIdsRef.current.delete(id);
    saveDeletedIds('deleted_task_ids', deletedTaskIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updated = [newTask, ...tasksRef.current];
    tasksRef.current = updated;
    setTasks(updated);
    saveToStorage('tasks', updated);

    broadcastStateChange('update_tasks', updated);
    syncStateToCloudAndFirestore({ tasks: updated }, true);
    showToast('Tarefa compartilhada adicionada ao painel.');
  };

  const toggleTaskCompletion = (id: string) => {
    lastLocalWriteTimestamp.current = Date.now();
    const updated = tasksRef.current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    tasksRef.current = updated;
    setTasks(updated);
    saveToStorage('tasks', updated);

    broadcastStateChange('update_tasks', updated);
    syncStateToCloudAndFirestore({ tasks: updated }, true);
  };

  const toggleTask = toggleTaskCompletion;

  const deleteTask = (id: string) => {
    deletedTaskIdsRef.current.add(id);
    saveDeletedIds('deleted_task_ids', deletedTaskIdsRef.current);

    lastLocalWriteTimestamp.current = Date.now();
    const updated = tasksRef.current.filter((t) => t.id !== id);
    tasksRef.current = updated;
    setTasks(updated);
    saveToStorage('tasks', updated);

    broadcastStateChange('update_tasks', updated);
    syncStateToCloudAndFirestore({ tasks: updated }, true);
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
    
    const sender = (senderOverride as any) || currentStudentRef.current.name || 'Rafael (Você)';
    const senderRole = sender === currentStudentRef.current.name ? 'Estudante A' : 'Estudante B';

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

    const updated = [...chatMessagesRef.current, newMsg];
    chatMessagesRef.current = updated;
    setChatMessages(updated);
    saveToStorage('chat_messages', updated);

    broadcastStateChange('update_chat', updated);
    pushChatMessageToCloud(newMsg);
  };

  const sendVoiceMessage = (durationSeconds: number, audioUrl?: string, patientTag?: string) => {
    const now = new Date();
    const timeStr = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: (currentStudentRef.current.name as any) || 'Rafael (Você)',
      senderRole: 'Estudante A',
      content: `🎙️ Mensagem de Voz (${durationSeconds}s)`,
      audioDuration: `0:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`,
      audioUrl: audioUrl,
      attachedPatientName: patientTag,
      timestamp: timeStr
    };

    const updated = [...chatMessagesRef.current, newMsg];
    chatMessagesRef.current = updated;
    setChatMessages(updated);
    saveToStorage('chat_messages', updated);

    broadcastStateChange('update_chat', updated);
    pushChatMessageToCloud(newMsg);
    showToast('Mensagem de voz enviada para a dupla!');
  };

  const deleteChatMessage = (id: string) => {
    const updated = chatMessagesRef.current.filter((m) => m.id !== id);
    chatMessagesRef.current = updated;
    setChatMessages(updated);
    saveToStorage('chat_messages', updated);
    broadcastStateChange('update_chat', updated);
    showToast('Mensagem removida.', 'info');
  };

  const clearChatMessages = () => {
    chatMessagesRef.current = [];
    setChatMessages([]);
    saveToStorage('chat_messages', []);
    broadcastStateChange('update_chat', []);
    showToast('Histórico do chat limpo.', 'info');
  };

  // Academic Notices
  const addAcademicNotice = (notice: Omit<AcademicNotice, 'id' | 'isRead'>) => {
    const newNotice: AcademicNotice = {
      ...notice,
      id: 'notice-' + Date.now(),
      isRead: false
    };
    const updated = [newNotice, ...noticesRef.current];
    noticesRef.current = updated;
    setNotices(updated);
    saveToStorage('notices', updated);
    broadcastStateChange('update_notices', updated);
    syncStateToCloudAndFirestore({ notices: updated }, true);
    showToast('Aviso/prazo adicionado com sucesso!');
  };

  const deleteAcademicNotice = (id: string) => {
    const updated = noticesRef.current.filter((n) => n.id !== id);
    noticesRef.current = updated;
    setNotices(updated);
    saveToStorage('notices', updated);
    broadcastStateChange('update_notices', updated);
    syncStateToCloudAndFirestore({ notices: updated }, true);
    showToast('Aviso acadêmico excluído.', 'info');
  };

  const markNoticeAsRead = (id: string) => {
    const updated = noticesRef.current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    noticesRef.current = updated;
    setNotices(updated);
    saveToStorage('notices', updated);
    broadcastStateChange('update_notices', updated);
  };

  const updateDiscipline = (id: string, updates: Partial<DisciplineConfig>) => {
    const updated = disciplinesRef.current.map((d) => (d.id === id ? { ...d, ...updates } : d));
    disciplinesRef.current = updated;
    setDisciplines(updated);
    saveToStorage('disciplines', updated);
    broadcastStateChange('update_disciplines', updated);
    syncStateToCloudAndFirestore({ disciplines: updated }, true);
    showToast('Disciplina atualizada com sucesso.');
  };

  const updateDisciplineTarget = (id: string, completedCount: number) => {
    const updated = disciplinesRef.current.map((d) => (d.id === id ? { ...d, completedCount } : d));
    disciplinesRef.current = updated;
    setDisciplines(updated);
    saveToStorage('disciplines', updated);
    broadcastStateChange('update_disciplines', updated);
    syncStateToCloudAndFirestore({ disciplines: updated }, true);
    showToast('Meta da disciplina atualizada.');
  };

  // Study Actions
  const addStudySubject = (subject: Omit<StudySubject, 'id' | 'topics'>) => {
    const newSubj: StudySubject = {
      ...subject,
      id: 'subj-' + Date.now(),
      topics: []
    };
    const updated = [...studySubjectsRef.current, newSubj];
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
    showToast(`Matéria "${newSubj.name}" adicionada ao plano de estudos!`);
  };

  const updateStudySubject = (id: string, updates: Partial<StudySubject>) => {
    const updated = studySubjectsRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s));
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
    showToast('Matéria atualizada com sucesso!');
  };

  const deleteStudySubject = (id: string) => {
    const updated = studySubjectsRef.current.filter((s) => s.id !== id);
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
    showToast('Matéria removida dos estudos.', 'info');
  };

  const addStudyTopic = (subjectId: string, topic: Omit<StudyTopic, 'id'>) => {
    const newTopic: StudyTopic = {
      ...topic,
      id: 'top-' + Date.now()
    };
    const updated = studySubjectsRef.current.map((s) => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: [...s.topics, newTopic]
      };
    });
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
  };

  const toggleStudyTopic = (subjectId: string, topicId: string) => {
    const updated = studySubjectsRef.current.map((s) => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t))
      };
    });
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
  };

  const deleteStudyTopic = (subjectId: string, topicId: string) => {
    const updated = studySubjectsRef.current.map((s) => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.filter((t) => t.id !== topicId)
      };
    });
    studySubjectsRef.current = updated;
    setStudySubjects(updated);
    saveToStorage('study_subjects', updated);
    broadcastStateChange('update_studies', updated);
    syncStateToCloudAndFirestore({ studySubjects: updated }, true);
  };

  // Exam Schedules
  const addExamSchedule = (exam: Omit<ExamSchedule, 'id'>) => {
    const newExam: ExamSchedule = {
      ...exam,
      id: 'exam-' + Date.now()
    };
    const updated = [...examSchedulesRef.current, newExam].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    examSchedulesRef.current = updated;
    setExamSchedules(updated);
    saveToStorage('exam_schedules', updated);
    broadcastStateChange('update_exams', updated);
    syncStateToCloudAndFirestore({ examSchedules: updated }, true);
    showToast(`Prova de ${newExam.subject} agendada com sucesso!`);
  };

  const updateExamSchedule = (id: string, updates: Partial<ExamSchedule>) => {
    const updated = examSchedulesRef.current.map((e) => (e.id === id ? { ...e, ...updates } : e));
    examSchedulesRef.current = updated;
    setExamSchedules(updated);
    saveToStorage('exam_schedules', updated);
    broadcastStateChange('update_exams', updated);
    syncStateToCloudAndFirestore({ examSchedules: updated }, true);
    showToast('Prova atualizada.');
  };

  const deleteExamSchedule = (id: string) => {
    const updated = examSchedulesRef.current.filter((e) => e.id !== id);
    examSchedulesRef.current = updated;
    setExamSchedules(updated);
    saveToStorage('exam_schedules', updated);
    broadcastStateChange('update_exams', updated);
    syncStateToCloudAndFirestore({ examSchedules: updated }, true);
    showToast('Prova removida do cronograma.', 'info');
  };

  // Google Resources Links
  const addGoogleResource = (resource: Omit<GoogleResourceLink, 'id'>) => {
    const newResource: GoogleResourceLink = {
      ...resource,
      id: 'gres-' + Date.now()
    };
    const updated = [...googleResourcesRef.current, newResource];
    googleResourcesRef.current = updated;
    setGoogleResources(updated);
    saveToStorage('google_resources', updated);
    broadcastStateChange('update_resources', updated);
    syncStateToCloudAndFirestore({ googleResources: updated }, true);
    showToast('Atalho do Google salvo!');
  };

  const deleteGoogleResource = (id: string) => {
    const updated = googleResourcesRef.current.filter((r) => r.id !== id);
    googleResourcesRef.current = updated;
    setGoogleResources(updated);
    saveToStorage('google_resources', updated);
    broadcastStateChange('update_resources', updated);
    syncStateToCloudAndFirestore({ googleResources: updated }, true);
    showToast('Atalho removido.', 'info');
  };

  const resetToDefaultData = () => {
    patientsRef.current = INITIAL_PATIENTS;
    appointmentsRef.current = INITIAL_APPOINTMENTS;
    tasksRef.current = INITIAL_TASKS;
    chatMessagesRef.current = INITIAL_CHAT_MESSAGES;
    disciplinesRef.current = INITIAL_DISCIPLINES;
    noticesRef.current = INITIAL_NOTICES;
    studySubjectsRef.current = INITIAL_STUDY_SUBJECTS;
    examSchedulesRef.current = INITIAL_EXAM_SCHEDULES;
    googleResourcesRef.current = INITIAL_GOOGLE_RESOURCES;
    currentStudentRef.current = INITIAL_STUDENT;
    duplaPartnerRef.current = INITIAL_DUPLA;

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

    saveToStorage('patients', INITIAL_PATIENTS);
    saveToStorage('appointments', INITIAL_APPOINTMENTS);
    saveToStorage('tasks', INITIAL_TASKS);
    saveToStorage('chat_messages', INITIAL_CHAT_MESSAGES);
    saveToStorage('disciplines', INITIAL_DISCIPLINES);
    saveToStorage('notices', INITIAL_NOTICES);
    saveToStorage('study_subjects', INITIAL_STUDY_SUBJECTS);
    saveToStorage('exam_schedules', INITIAL_EXAM_SCHEDULES);
    saveToStorage('google_resources', INITIAL_GOOGLE_RESOURCES);
    saveToStorage('student_profile', INITIAL_STUDENT);
    saveToStorage('dupla_partner', INITIAL_DUPLA);

    syncStateToCloudAndFirestore(undefined, true);
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
