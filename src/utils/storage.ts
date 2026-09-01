import { 
  Patient, 
  Appointment, 
  TaskItem, 
  ChatMessage, 
  DisciplineConfig, 
  AcademicNotice, 
  StudentProfile, 
  DuplaPartner,
  StudySubject,
  ExamSchedule,
  GoogleResourceLink
} from '../types';

const DB_NAME = 'OdontoAcademicoDB';
const DB_VERSION = 1;
const STORE_NAME = 'odonto_store';

export const getPatientActiveAllergies = (allergies?: string[]): string[] => {
  if (!allergies || !Array.isArray(allergies)) return [];
  return allergies.filter(a => {
    const trimmed = a.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return (
      !lower.includes('nenhuma') &&
      !lower.includes('não possui') &&
      !lower.includes('nao possui') &&
      !lower.includes('nega') &&
      !lower.includes('sem alergia') &&
      !lower.includes('sem alergias') &&
      !lower.includes('nenhum') &&
      !lower.includes('não relatada') &&
      !lower.includes('nao relatada') &&
      lower !== 'não' &&
      lower !== 'nao'
    );
  });
};

export const INITIAL_STUDENT: StudentProfile = {
  name: 'Rafael Miyasiro',
  university: 'UEL - Universidade Estadual de Londrina',
  semester: '8º Semestre - Odontologia',
  academicId: 'RA 2023-04821',
  avatar: 'RM'
};

export const INITIAL_DUPLA: DuplaPartner = {
  name: 'Beatriz Ramos',
  semester: '8º Semestre',
  phone: '(43) 99881-2233',
  avatar: 'BR'
};

export const INITIAL_STUDY_SUBJECTS: StudySubject[] = [];

export const INITIAL_EXAM_SCHEDULES: ExamSchedule[] = [];

export const INITIAL_GOOGLE_RESOURCES: GoogleResourceLink[] = [];

export const INITIAL_DISCIPLINES: DisciplineConfig[] = [
  { id: '1', name: 'Dentística Restauradora', color: '#10b981', professor: 'Prof. Dr. Ricardo Silva', roomOrBox: 'Clínica 2 - Box 04', targetCount: 12, completedCount: 0 },
  { id: '2', name: 'Endodontia', color: '#0ea5e9', professor: 'Profa. Dra. Mariana Costa', roomOrBox: 'Clínica 1 - Box 12', targetCount: 6, completedCount: 0 },
  { id: '3', name: 'Cirurgia Bucomaxilofacial', color: '#f43f5e', professor: 'Prof. Dr. Fernando Rocha', roomOrBox: 'Clínica Cirúrgica - Box 02', targetCount: 8, completedCount: 0 },
  { id: '4', name: 'Periodontia', color: '#8b5cf6', professor: 'Profa. Dra. Camila Mendes', roomOrBox: 'Clínica 3 - Box 08', targetCount: 10, completedCount: 0 },
  { id: '5', name: 'Prótese Dentária', color: '#f59e0b', professor: 'Prof. Dr. Marcelo Alvarez', roomOrBox: 'Clínica 4 - Box 15', targetCount: 6, completedCount: 0 },
  { id: '6', name: 'Odontopediatria', color: '#ec4899', professor: 'Profa. Dra. Letícia Nunes', roomOrBox: 'Clínica Infantil - Box 06', targetCount: 8, completedCount: 0 },
  { id: '7', name: 'Radiologia & Imaginologia', color: '#06b6d4', professor: 'Prof. Dr. Gabriel Torres', roomOrBox: 'Lab de Raios-X', targetCount: 15, completedCount: 0 },
  { id: '8', name: 'Semiologia & Diagnóstico', color: '#14b8a6', professor: 'Prof. Dr. Henrique Souza', roomOrBox: 'Triagem / Box 01', targetCount: 10, completedCount: 0 },
  { id: '9', name: 'Clínica Integrada', color: '#059669', professor: 'Profa. Dra. Beatriz Ramos', roomOrBox: 'Clínica Geral - Box 10', targetCount: 14, completedCount: 0 }
];

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_TASKS: TaskItem[] = [];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const INITIAL_NOTICES: AcademicNotice[] = [];

// Normalized key helper for consistent storage keys
function normalizeKey(key: string): string {
  return key.startsWith('odonto_') ? key : `odonto_${key}`;
}

export function getSyncStorage<T>(key: string, defaultValue: T): T {
  const fullKey = normalizeKey(key);
  try {
    const localVal = localStorage.getItem(fullKey);
    if (localVal !== null && localVal !== undefined) {
      return JSON.parse(localVal);
    }
    // Also check legacy non-prefixed key if exists
    const legacyKey = key.replace(/^odonto_/, '');
    const legacyVal = localStorage.getItem(legacyKey);
    if (legacyVal !== null && legacyVal !== undefined) {
      return JSON.parse(legacyVal);
    }
  } catch (err) {
    console.warn(`Error reading localStorage for ${key}:`, err);
  }
  return defaultValue;
}

// IndexedDB Helper for robust offline database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  const fullKey = normalizeKey(key);
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(fullKey);

      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result);
        } else {
          // Fallback to localStorage if available
          const localVal = localStorage.getItem(fullKey);
          if (localVal !== null && localVal !== undefined) {
            try {
              resolve(JSON.parse(localVal));
            } catch {
              resolve(defaultValue);
            }
          } else {
            resolve(defaultValue);
          }
        }
      };

      req.onerror = () => {
        const localVal = localStorage.getItem(fullKey);
        if (localVal !== null && localVal !== undefined) {
          try {
            resolve(JSON.parse(localVal));
          } catch {
            resolve(defaultValue);
          }
        } else {
          resolve(defaultValue);
        }
      };
    });
  } catch {
    const localVal = localStorage.getItem(fullKey);
    if (localVal !== null && localVal !== undefined) {
      try {
        return JSON.parse(localVal);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  const fullKey = normalizeKey(key);
  try {
    // Save to localStorage as backup
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch {
    // Ignored if local storage exceeds quota, IndexedDB will handle large image blobs
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, fullKey);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB, fallback to localStorage only:', err);
  }
}
