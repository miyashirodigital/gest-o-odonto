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
  Unsubscribe 
} from 'firebase/firestore';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const FIREBASE_CONFIG_KEY = 'odonto_firebase_config';

export function getSavedFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Erro ao ler Firebase Config local:', e);
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
    const config = customConfig || getSavedFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return { app: null, db: null };
    }

    if (getApps().length > 0) {
      firebaseAppInstance = getApp();
    } else {
      firebaseAppInstance = initializeApp(config);
    }

    firestoreInstance = getFirestore(firebaseAppInstance);
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
