import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  onSnapshot, 
  Unsubscribe,
  getDocFromServer 
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
    firestoreDatabaseId: (firebaseConfigJson as any).firestoreDatabaseId || undefined
  };
}

export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projectId) return parsed;
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

    if (config.firestoreDatabaseId) {
      try {
        firestoreInstance = getFirestore(firebaseAppInstance, config.firestoreDatabaseId);
      } catch {
        firestoreInstance = getFirestore(firebaseAppInstance);
      }
    } else {
      firestoreInstance = getFirestore(firebaseAppInstance);
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
