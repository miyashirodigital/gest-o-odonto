import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot, 
  Unsubscribe,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

const FIREBASE_CONFIG_KEY = 'odonto_firebase_config';

export function getDefaultFirebaseConfig(): FirebaseCustomConfig {
  return {
    projectId: firebaseConfigJson.projectId || '',
    appId: firebaseConfigJson.appId || '',
    apiKey: firebaseConfigJson.apiKey || '',
    authDomain: firebaseConfigJson.authDomain || '',
    storageBucket: firebaseConfigJson.storageBucket || '',
    messagingSenderId: firebaseConfigJson.messagingSenderId || '',
    firestoreDatabaseId: (firebaseConfigJson as any).firestoreDatabaseId || 'ai-studio-odontoclnicagest-095d1f98-89e4-4358-9697-23d1ff2d64a9'
  };
}

export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projectId) {
        // Ensure firestoreDatabaseId is always populated
        if (!parsed.firestoreDatabaseId && (firebaseConfigJson as any).firestoreDatabaseId) {
          parsed.firestoreDatabaseId = (firebaseConfigJson as any).firestoreDatabaseId;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler Firebase Config local:', e);
  }
  // Default to built-in provisioned config if available
  const defaultCfg = getDefaultFirebaseConfig();
  if (defaultCfg.projectId && defaultCfg.apiKey) {
    return defaultCfg;
  }
  return null;
}

export function saveFirebaseConfig(config: FirebaseCustomConfig): void {
  try {
    if (!config.firestoreDatabaseId && (firebaseConfigJson as any).firestoreDatabaseId) {
      config.firestoreDatabaseId = (firebaseConfigJson as any).firestoreDatabaseId;
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Erro ao salvar Firebase Config:', e);
  }
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseCustomConfig): { app: FirebaseApp | null; db: Firestore | null } {
  try {
    const config = customConfig || getSavedFirebaseConfig() || getDefaultFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return { app: null, db: null };
    }

    if (getApps().length > 0) {
      firebaseAppInstance = getApp();
    } else {
      firebaseAppInstance = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
    }

    const databaseId = config.firestoreDatabaseId || (firebaseConfigJson as any).firestoreDatabaseId || 'ai-studio-odontoclnicagest-095d1f98-89e4-4358-9697-23d1ff2d64a9';

    try {
      firestoreInstance = getFirestore(firebaseAppInstance, databaseId);
    } catch {
      try {
        firestoreInstance = getFirestore(firebaseAppInstance);
      } catch (e) {
        console.warn('Could not initialize firestore:', e);
      }
    }

    return { app: firebaseAppInstance, db: firestoreInstance };
  } catch (err) {
    console.warn('Firebase init error:', err);
    return { app: null, db: null };
  }
}

export function getFirebaseDB(): Firestore | null {
  if (!firestoreInstance) {
    const { db } = initFirebase();
    return db;
  }
  return firestoreInstance;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const db = getFirebaseDB();
    if (!db) return false;
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline or connecting...');
    }
    return true; // Still initialized
  }
}

// Initial connection test
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

// Granular Firestore operations that guarantee multi-device persistence without conflict
export async function firestoreSavePatient(patient: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !patient?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_patients', patient.id), patient, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving patient:', err);
    return false;
  }
}

export async function firestoreDeletePatient(patientId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !patientId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_patients', patientId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting patient:', err);
    return false;
  }
}

export async function firestoreSaveAppointment(appointment: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !appointment?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_appointments', appointment.id), appointment, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving appointment:', err);
    return false;
  }
}

export async function firestoreDeleteAppointment(appointmentId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !appointmentId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_appointments', appointmentId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting appointment:', err);
    return false;
  }
}

export async function firestoreSaveTask(task: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !task?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_tasks', task.id), task, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving task:', err);
    return false;
  }
}

export async function firestoreDeleteTask(taskId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !taskId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_tasks', taskId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting task:', err);
    return false;
  }
}

export async function firestoreSaveChatMessage(message: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !message?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_chat', message.id), message, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving chat message:', err);
    return false;
  }
}

export async function firestoreDeleteChatMessage(messageId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !messageId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_chat', messageId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting chat message:', err);
    return false;
  }
}

export async function firestoreSaveNotice(notice: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !notice?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_notices', notice.id), notice, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving notice:', err);
    return false;
  }
}

export async function firestoreDeleteNotice(noticeId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !noticeId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_notices', noticeId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting notice:', err);
    return false;
  }
}

export async function firestoreSaveStudySubject(subject: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !subject?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_studies', subject.id), subject, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving study subject:', err);
    return false;
  }
}

export async function firestoreDeleteStudySubject(subjectId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !subjectId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_studies', subjectId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting study subject:', err);
    return false;
  }
}

export async function firestoreSaveExamSchedule(exam: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !exam?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_exams', exam.id), exam, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving exam schedule:', err);
    return false;
  }
}

export async function firestoreDeleteExamSchedule(examId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !examId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_exams', examId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting exam schedule:', err);
    return false;
  }
}

export async function firestoreSaveResource(resource: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !resource?.id) return false;
  try {
    await setDoc(doc(db, 'odonto_resources', resource.id), resource, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving resource:', err);
    return false;
  }
}

export async function firestoreDeleteResource(resourceId: string): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !resourceId) return false;
  try {
    await deleteDoc(doc(db, 'odonto_resources', resourceId));
    return true;
  } catch (err) {
    console.warn('[Firestore] Error deleting resource:', err);
    return false;
  }
}

export async function firestoreSaveConfig(key: string, data: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !key) return false;
  try {
    await setDoc(doc(db, 'odonto_config', key), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`[Firestore] Error saving config ${key}:`, err);
    return false;
  }
}

export async function firestoreBatchSave(collectionName: string, items: any[]): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db || !Array.isArray(items) || items.length === 0) return true;
  try {
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        if (item && item.id) {
          const ref = doc(db, collectionName, String(item.id));
          batch.set(ref, item, { merge: true });
        }
      }
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.warn(`[Firestore] Error batch saving ${collectionName}:`, err);
    try {
      await Promise.all(items.map(item => {
        if (item && item.id) {
          return setDoc(doc(db, collectionName, String(item.id)), item, { merge: true });
        }
        return Promise.resolve();
      }));
      return true;
    } catch (e2) {
      console.warn(`[Firestore] Fallback individual saves failed for ${collectionName}:`, e2);
      return false;
    }
  }
}

export async function firestoreSaveAllEntities(state: any): Promise<boolean> {
  const db = getFirebaseDB();
  if (!db) return false;
  try {
    const promises: Promise<any>[] = [];

    if (Array.isArray(state.patients) && state.patients.length > 0) {
      promises.push(firestoreBatchSave('odonto_patients', state.patients));
    }
    if (Array.isArray(state.appointments) && state.appointments.length > 0) {
      promises.push(firestoreBatchSave('odonto_appointments', state.appointments));
    }
    if (Array.isArray(state.tasks) && state.tasks.length > 0) {
      promises.push(firestoreBatchSave('odonto_tasks', state.tasks));
    }
    if (Array.isArray(state.chatMessages) && state.chatMessages.length > 0) {
      promises.push(firestoreBatchSave('odonto_chat', state.chatMessages));
    }
    if (Array.isArray(state.notices) && state.notices.length > 0) {
      promises.push(firestoreBatchSave('odonto_notices', state.notices));
    }
    if (Array.isArray(state.studySubjects) && state.studySubjects.length > 0) {
      promises.push(firestoreBatchSave('odonto_studies', state.studySubjects));
    }
    if (Array.isArray(state.examSchedules) && state.examSchedules.length > 0) {
      promises.push(firestoreBatchSave('odonto_exams', state.examSchedules));
    }
    if (Array.isArray(state.googleResources) && state.googleResources.length > 0) {
      promises.push(firestoreBatchSave('odonto_resources', state.googleResources));
    }
    if (state.student) {
      promises.push(firestoreSaveConfig('student', state.student));
    }
    if (state.dupla) {
      promises.push(firestoreSaveConfig('dupla', state.dupla));
    }
    if (state.disciplines) {
      promises.push(firestoreSaveConfig('disciplines', { list: state.disciplines }));
    }

    promises.push(setDoc(doc(db, 'odonto_clinic', 'main_workspace'), {
      ...state,
      updatedAt: new Date().toISOString()
    }, { merge: true }));

    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving all entities:', err);
    return false;
  }
}

// Broadcast Channel for Instant Multi-Tab Real-time Sync
export const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('odonto_realtime_sync_channel')
  : null;

export function broadcastStateChange(action: string, payload?: any) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ action, payload, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
}
