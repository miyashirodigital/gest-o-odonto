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

export interface CloudClinicState {
  patients?: Patient[];
  appointments?: Appointment[];
  tasks?: TaskItem[];
  chatMessages?: ChatMessage[];
  disciplines?: DisciplineConfig[];
  notices?: AcademicNotice[];
  studySubjects?: StudySubject[];
  examSchedules?: ExamSchedule[];
  googleResources?: GoogleResourceLink[];
  student?: StudentProfile;
  dupla?: DuplaPartner;
  settings?: {
    darkMode?: boolean;
    privacyMode?: boolean;
    userPin?: string;
  };
  updatedAt: number;
  source?: string;
}

export interface CloudSyncCallbacks {
  onInit: (state: CloudClinicState, connectedDevices: number) => void;
  onStateUpdate: (state: CloudClinicState, source?: string) => void;
  onNewChatMessage: (message: ChatMessage, allMessages?: ChatMessage[]) => void;
  onPresence: (connectedDevices: number) => void;
  onConnectionChange: (connected: boolean) => void;
}

let eventSourceInstance: EventSource | null = null;
let reconnectTimer: any = null;
let isSubscribed = false;

export async function fetchCloudState(): Promise<{ state: CloudClinicState | null; connectedDevices: number }> {
  try {
    const res = await fetch('/api/sync/state', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      state: data.state || null,
      connectedDevices: data.connectedDevices || 1
    };
  } catch (err) {
    console.warn('[CloudSync] Falha ao buscar estado da nuvem:', err);
    return { state: null, connectedDevices: 1 };
  }
}

export async function pushCloudState(updates: Partial<CloudClinicState>): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      ...updates,
      source: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'Celular' : 'Computador') : 'Device'
    });

    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Falha ao enviar atualização para a nuvem:', err);
    return false;
  }
}

export async function pushChatMessageToCloud(message: ChatMessage): Promise<boolean> {
  try {
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Falha ao enviar mensagem de chat:', err);
    return false;
  }
}

export function subscribeToCloudEvents(callbacks: CloudSyncCallbacks): () => void {
  isSubscribed = true;

  function connect() {
    if (!isSubscribed) return;
    if (eventSourceInstance) {
      try {
        eventSourceInstance.close();
      } catch {
        // ignore
      }
    }

    try {
      const es = new EventSource('/api/sync/events');
      eventSourceInstance = es;

      es.onopen = () => {
        callbacks.onConnectionChange(true);
      };

      es.onmessage = (event) => {
        try {
          if (!event.data || event.data === ': heartbeat') return;
          const payload = JSON.parse(event.data);

          if (payload.type === 'init' && payload.state) {
            callbacks.onInit(payload.state, payload.connectedClients || 1);
          } else if (payload.type === 'state_update' && payload.state) {
            callbacks.onStateUpdate(payload.state, payload.source);
          } else if (payload.type === 'new_chat_message' && payload.message) {
            callbacks.onNewChatMessage(payload.message, payload.chatMessages);
          } else if (payload.type === 'presence') {
            callbacks.onPresence(payload.connectedClients || 1);
          }
        } catch (e) {
          console.warn('[CloudSync] Erro ao processar evento SSE:', e);
        }
      };

      es.onerror = () => {
        callbacks.onConnectionChange(false);
        try {
          es.close();
        } catch {
          // ignore
        }
        eventSourceInstance = null;

        // Schedule reconnection
        if (isSubscribed && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 3000);
        }
      };
    } catch (e) {
      console.warn('[CloudSync] EventSource setup error:', e);
      callbacks.onConnectionChange(false);
      if (isSubscribed && !reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, 5000);
      }
    }
  }

  // Handle visibility & online events (especially for mobile phones when locking/unlocking screen)
  const handleVisibilityOrOnline = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      if (!eventSourceInstance || eventSourceInstance.readyState === EventSource.CLOSED) {
        connect();
      }
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityOrOnline);
  window.addEventListener('online', handleVisibilityOrOnline);

  connect();

  return () => {
    isSubscribed = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    window.removeEventListener('visibilitychange', handleVisibilityOrOnline);
    window.removeEventListener('online', handleVisibilityOrOnline);
    if (eventSourceInstance) {
      try {
        eventSourceInstance.close();
      } catch {
        // ignore
      }
      eventSourceInstance = null;
    }
  };
}
