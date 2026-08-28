export type DisciplineType = 
  | 'Dentística Restauradora'
  | 'Endodontia'
  | 'Periodontia'
  | 'Cirurgia Bucomaxilofacial'
  | 'Prótese Dentária'
  | 'Odontopediatria'
  | 'Radiologia & Imaginologia'
  | 'Semiologia & Diagnóstico'
  | 'Ortodontia'
  | 'Clínica Integrada';

export interface DisciplineConfig {
  id: string;
  name: DisciplineType;
  color: string;
  professor: string;
  roomOrBox: string;
  targetCount: number;
  completedCount: number;
}

export type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Em Atendimento' | 'Concluído' | 'Faltou' | 'Desmarcado';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  discipline: DisciplineType;
  procedure: string;
  boxNumber: string;
  notes?: string;
  status: AppointmentStatus;
  remindedViaWhatsApp?: boolean;
}

export type ToothSurface = 'O' | 'M' | 'D' | 'V' | 'L' | 'P' | 'G' | 'I'; // Oclusal, Mesial, Distal, Vestibular, Lingual, Palatina, Geral, Incisal

export type ToothCondition = 
  | 'higido' 
  | 'carie' 
  | 'restauracao_resina' 
  | 'restauracao_amalgama' 
  | 'tratamento_canal' 
  | 'coroa_protese' 
  | 'exodontia_indicada' 
  | 'ausente' 
  | 'implante'
  | 'selante'
  | 'fratura';

export interface ToothData {
  toothNumber: number; // e.g., 18, 11, 21, 36, 47, or 51-85 for deciduous
  conditions: {
    surface: ToothSurface;
    condition: ToothCondition;
    notes?: string;
  }[];
  generalCondition?: ToothCondition;
  notes?: string;
}

export interface ClinicalEvolution {
  id: string;
  date: string;
  discipline: DisciplineType;
  professor: string;
  procedureDone: string;
  anestheticUsed?: string;
  tubesUsed?: number;
  teethInvolved?: string;
  postOpObservations?: string;
  studentNotes?: string;
  evaluatedGrade?: string;
  signedByProfessor: boolean;
  createdAt: string;
}

export interface RadiographExam {
  id: string;
  title: string;
  date: string;
  type: 'Periapical' | 'Interproximal (Bite-wing)' | 'Panorâmica' | 'Oclusal' | 'Telerradiografia' | 'Tomografia' | 'Foto Intraoral' | 'Foto Extraoral';
  imageUrl: string;
  notes?: string;
  teethReferenced?: string;
  diagnosis?: string;
  tags?: string[];
}

export interface PatientAnamnese {
  chiefComplaint: string; // Queixa principal
  currentIllnessHistory: string; // HMA
  medicalHistory: {
    hypertension: boolean;
    diabetes: boolean;
    cardiacProblems: boolean;
    bleedingDisorders: boolean;
    hepatitisOrHIV: boolean;
    asthmaOrRespiratory: boolean;
    pregnantOrLactating: boolean;
    otherConditions?: string;
  };
  allergies: string[]; // e.g. Penicilina, Látex, Dipirona, Anestésico com vaso
  continuousMedications: string[];
  vitalSigns: {
    bloodPressure?: string; // e.g. "120x80"
    heartRate?: string;
    bloodGlucose?: string;
  };
  habits: {
    smoker: boolean;
    alcohol: boolean;
    bruxism: boolean;
    nailBiting: boolean;
  };
  lastDentalVisit?: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate: string;
  gender: 'Feminino' | 'Masculino' | 'Outro';
  phone: string;
  emergencyContact?: string;
  recordNumber: string; // Nº Prontuário acadêmico
  discipline: DisciplineType;
  address?: string;
  anamnese: PatientAnamnese;
  odontogram: Record<number, ToothData>;
  evolutions: ClinicalEvolution[];
  exams: RadiographExam[];
  academicObservations?: string;
  consentSigned: boolean;
  consentSignatureDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: 'Esterilização' | 'Material de Aula' | 'Prontuário & Caso' | 'Estudo/Prova' | 'Outro';
  dueDate?: string;
  discipline?: DisciplineType;
  assignedTo: 'Rafael (Você)' | 'Dupla de Clínica' | 'Ambos';
  completed: boolean;
  priority: 'baixa' | 'media' | 'alta';
  createdAt: string;
}

export type ViewTab = 'dashboard' | 'patients' | 'calendar' | 'chat' | 'tasks' | 'ai-assistant' | 'settings';

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: 'Estudante A' | 'Estudante B';
  content: string;
  text?: string;
  timestamp: string;
  isImage?: boolean;
  imageUrl?: string;
  attachedPatientId?: string;
  attachedPatientName?: string;
  patientTag?: string;
  audioDuration?: string;
}

export interface AcademicNotice {
  id: string;
  title: string;
  discipline: DisciplineType;
  date: string;
  type: 'Entrega de Ficha' | 'Prova Prática' | 'Atendimento Clínico' | 'Seminário';
  description: string;
  isRead: boolean;
}

export interface StudentProfile {
  name: string;
  university: string;
  semester: string;
  academicId: string;
  avatar?: string;
}

export interface DuplaPartner {
  name: string;
  semester: string;
  phone: string;
  avatar: string;
}
