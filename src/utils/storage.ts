import { Patient, Appointment, TaskItem, ChatMessage, DisciplineConfig, AcademicNotice, StudentProfile, DuplaPartner } from '../types';

const DB_NAME = 'OdontoAcademicoDB';
const DB_VERSION = 1;
const STORE_NAME = 'odonto_store';

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

export const INITIAL_DISCIPLINES: DisciplineConfig[] = [
  { id: '1', name: 'Dentística Restauradora', color: '#10b981', professor: 'Prof. Dr. Ricardo Silva', roomOrBox: 'Clínica 2 - Box 04', targetCount: 12, completedCount: 8 },
  { id: '2', name: 'Endodontia', color: '#0ea5e9', professor: 'Profa. Dra. Mariana Costa', roomOrBox: 'Clínica 1 - Box 12', targetCount: 6, completedCount: 4 },
  { id: '3', name: 'Cirurgia Bucomaxilofacial', color: '#f43f5e', professor: 'Prof. Dr. Fernando Rocha', roomOrBox: 'Clínica Cirúrgica - Box 02', targetCount: 8, completedCount: 5 },
  { id: '4', name: 'Periodontia', color: '#8b5cf6', professor: 'Profa. Dra. Camila Mendes', roomOrBox: 'Clínica 3 - Box 08', targetCount: 10, completedCount: 7 },
  { id: '5', name: 'Prótese Dentária', color: '#f59e0b', professor: 'Prof. Dr. Marcelo Alvarez', roomOrBox: 'Clínica 4 - Box 15', targetCount: 6, completedCount: 3 },
  { id: '6', name: 'Odontopediatria', color: '#ec4899', professor: 'Profa. Dra. Letícia Nunes', roomOrBox: 'Clínica Infantil - Box 06', targetCount: 8, completedCount: 4 },
  { id: '7', name: 'Radiologia & Imaginologia', color: '#06b6d4', professor: 'Prof. Dr. Gabriel Torres', roomOrBox: 'Lab de Raios-X', targetCount: 15, completedCount: 12 },
  { id: '8', name: 'Semiologia & Diagnóstico', color: '#14b8a6', professor: 'Prof. Dr. Henrique Souza', roomOrBox: 'Triagem / Box 01', targetCount: 10, completedCount: 9 },
  { id: '9', name: 'Clínica Integrada', color: '#059669', professor: 'Profa. Dra. Beatriz Ramos', roomOrBox: 'Clínica Geral - Box 10', targetCount: 14, completedCount: 10 }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Ana Carolina Mendes',
    cpf: '342.981.408-12',
    rg: '45.123.890-X',
    birthDate: '1998-04-15',
    gender: 'Feminino',
    phone: '43991234567',
    emergencyContact: 'Marido Carlos (43) 99876-5432',
    recordNumber: 'UEL-2026/0412',
    discipline: 'Dentística Restauradora',
    address: 'Rua Santos, 450 - Londrina, PR',
    consentSigned: true,
    consentSignatureDate: '2026-08-10',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-25T14:30:00.000Z',
    anamnese: {
      chiefComplaint: 'Sinto dor leve e sensibilidade no dente posterior direito ao tomar água gelada e mastigar doces.',
      currentIllnessHistory: 'Paciente relata início dos sintomas há cerca de 3 semanas. Nega dor espontânea noturna.',
      medicalHistory: {
        hypertension: false,
        diabetes: false,
        cardiacProblems: false,
        bleedingDisorders: false,
        hepatitisOrHIV: false,
        asthmaOrRespiratory: false,
        pregnantOrLactating: false,
        otherConditions: 'Nenhuma alteração sistêmica relevante.'
      },
      allergies: ['Penicilina (relata erupção cutânea)'],
      continuousMedications: ['Anticoncepcional oral'],
      vitalSigns: {
        bloodPressure: '115x75 mmHg',
        heartRate: '72 bpm',
        bloodGlucose: '88 mg/dL'
      },
      habits: {
        smoker: false,
        alcohol: false,
        bruxism: true,
        nailBiting: false
      },
      lastDentalVisit: 'Há 1 ano e meio para limpeza de rotina.'
    },
    odontogram: {
      16: {
        toothNumber: 16,
        conditions: [
          { surface: 'O', condition: 'carie', notes: 'Lesão de cárie cavitada em esmalte e dentina média na oclusal.' },
          { surface: 'M', condition: 'carie', notes: 'Acometimento interproximal mesial detectado no raio-X.' }
        ],
        notes: 'Indicada restauração Classe II MO em Resina Composta.'
      },
      26: {
        toothNumber: 26,
        conditions: [
          { surface: 'O', condition: 'restauracao_resina', notes: 'Restauração satisfatória.' }
        ]
      },
      36: {
        toothNumber: 36,
        conditions: [
          { surface: 'O', condition: 'restauracao_amalgama', notes: 'Amálgama íntegro com boa adaptação marginal.' }
        ]
      },
      46: {
        toothNumber: 46,
        conditions: [
          { surface: 'O', condition: 'selante', notes: 'Selante oclusal preservado.' }
        ]
      }
    },
    evolutions: [
      {
        id: 'evo-1',
        date: '2026-08-15',
        discipline: 'Semiologia & Diagnóstico',
        professor: 'Prof. Dr. Henrique Souza',
        procedureDone: 'Exame clínico completo, anamnese, odontograma e solicitação de radiografias periapicais de dentes 16 e 46.',
        studentNotes: 'Paciente colaborativa e pontual. Confirmada alergia à Penicilina na capa do prontuário.',
        signedByProfessor: true,
        createdAt: '2026-08-15T10:30:00.000Z'
      },
      {
        id: 'evo-2',
        date: '2026-08-22',
        discipline: 'Dentística Restauradora',
        professor: 'Prof. Dr. Ricardo Silva',
        procedureDone: 'Anestesia infiltrativa terminal (Articaína 4% com epinefrina 1:100.000 - 1 tubete). Isolamento absoluto do campo operatório com lençol de borracha e grampo 202. Remoção de tecido cariado no elemento 16. Preparo cavitário classe II MO. Condicionamento ácido seletivo em esmalte, aplicação do sistema adesivo Single Bond Universal e restauração incremental com Resina Composta Z350 XT cor A2B.',
        anestheticUsed: 'Articaína 4% 1:100.000',
        tubesUsed: 1,
        teethInvolved: 'Dente 16',
        postOpObservations: 'Checagem oclusal com carbono 200 micras e fitas finas. Ajuste oclusal satisfatório. Acabamento inicial realizado. Polimento final agendado para próxima sessão.',
        studentNotes: 'Execução aprovada com nota 9.5 pelo professor de clínica.',
        evaluatedGrade: '9.5 / 10.0',
        signedByProfessor: true,
        createdAt: '2026-08-22T16:00:00.000Z'
      }
    ],
    exams: [
      {
        id: 'exam-1',
        title: 'Radiografia Periapical - Elemento 16 (Pré-Operatório)',
        date: '2026-08-15',
        type: 'Periapical',
        imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80',
        notes: 'Área radiolúcida sugestiva de lesão de cárie em face oclusomesial do dente 16 sem invasão da câmara pulpar. Espaço do ligamento periodontal normal.',
        teethReferenced: '16',
        diagnosis: 'Cárie dentinária média em dente 16',
        tags: ['Pré-operatório', 'Dentística', 'Periapical']
      },
      {
        id: 'exam-2',
        title: 'Foto Intraoral - Dente 16 pós-restauração',
        date: '2026-08-22',
        type: 'Foto Intraoral',
        imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=80',
        notes: 'Aspecto anatômico final da restauração em resina composta com estratificação oclusal e crista marginal mesial reconstruída.',
        teethReferenced: '16',
        diagnosis: 'Restauração Classe II concluída com sucesso',
        tags: ['Pós-operatório', 'Resina', 'Caso Clínico']
      }
    ]
  },
  {
    id: 'p2',
    name: 'Lucas Eduardo Silveira',
    cpf: '512.789.330-45',
    birthDate: '1992-11-03',
    gender: 'Masculino',
    phone: '43999887766',
    emergencyContact: 'Mãe Regina (43) 98877-6655',
    recordNumber: 'UEL-2026/0488',
    discipline: 'Endodontia',
    address: 'Av. Tiradentes, 1200 - Londrina, PR',
    consentSigned: true,
    consentSignatureDate: '2026-08-18',
    createdAt: '2026-08-18T14:00:00.000Z',
    updatedAt: '2026-08-26T11:00:00.000Z',
    anamnese: {
      chiefComplaint: 'Dor intensa e pulsátil no dente inferior esquerdo, piora muito à noite e ao calor.',
      currentIllnessHistory: 'Quadro doloroso agudo há 4 dias. Fez uso de analgésico por conta própria sem alívio sustentado.',
      medicalHistory: {
        hypertension: false,
        diabetes: false,
        cardiacProblems: false,
        bleedingDisorders: false,
        hepatitisOrHIV: false,
        asthmaOrRespiratory: false,
        pregnantOrLactating: false
      },
      allergies: ['Nenhuma alergia conhecida'],
      continuousMedications: [],
      vitalSigns: {
        bloodPressure: '120x80 mmHg',
        heartRate: '78 bpm',
        bloodGlucose: '92 mg/dL'
      },
      habits: {
        smoker: false,
        alcohol: true,
        bruxism: false,
        nailBiting: false
      },
      lastDentalVisit: 'Há mais de 3 anos.'
    },
    odontogram: {
      36: {
        toothNumber: 36,
        conditions: [
          { surface: 'O', condition: 'carie', notes: 'Lesão profunda com comprometimento pulpar.' },
          { surface: 'G', condition: 'tratamento_canal', notes: 'Tratamento endodôntico em andamento.' }
        ],
        notes: 'Diagnóstico de Pulpite Irreversível Sintomática.'
      }
    },
    evolutions: [
      {
        id: 'evo-3',
        date: '2026-08-18',
        discipline: 'Endodontia',
        professor: 'Profa. Dra. Mariana Costa',
        procedureDone: 'Anestesia por bloqueio do nervo alveolar inferior esquerdo com Mepivacaína 2% com epinefrina 1:100.000 (2 tubetes). Isolamento absoluto. Abertura coronária, localização dos 3 canais (Mesio-vestibular, Mesio-lingual e Distal). Pulpectomia, odontometria eletrônica foraminal, instrumentação mecanizada com sistema rotatório até lima WaveOne Gold. Irrigação abundante com Hipoclorito de Sódio 2.5%. Curativo de demora com Hidróxido de Cálcio P.A. e selamento provisório com Coltosol + CIV.',
        anestheticUsed: 'Mepivacaína 2% 1:100.000',
        tubesUsed: 2,
        teethInvolved: 'Dente 36',
        postOpObservations: 'Prescrito Ibuprofeno 600mg caso haja desconforto mastigatório. Retorno em 7 dias para obturação dos canais.',
        studentNotes: 'Localização dos condutos conferida no microscópio operatório da clínica.',
        evaluatedGrade: '10.0 / 10.0',
        signedByProfessor: true,
        createdAt: '2026-08-18T17:30:00.000Z'
      }
    ],
    exams: [
      {
        id: 'exam-3',
        title: 'Radiografia Periapical - Condutometria Dente 36',
        date: '2026-08-18',
        type: 'Periapical',
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
        notes: 'Comprimento real de trabalho ajustado 1mm aquém do ápice radiográfico em todos os 3 condutos radiculares.',
        teethReferenced: '36',
        diagnosis: 'Condutometria confirmada',
        tags: ['Endodontia', 'Condutometria', 'Dente 36']
      }
    ]
  },
  {
    id: 'p3',
    name: 'Juliana Beatriz Farias',
    cpf: '819.324.901-77',
    birthDate: '2001-07-22',
    gender: 'Feminino',
    phone: '43997766554',
    recordNumber: 'UEL-2026/0519',
    discipline: 'Cirurgia Bucomaxilofacial',
    address: 'Rua Goiás, 880 - Londrina, PR',
    consentSigned: true,
    consentSignatureDate: '2026-08-20',
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-27T09:00:00.000Z',
    anamnese: {
      chiefComplaint: 'Vim para extrair os dentes do siso que estão incomodando para empurrar os outros dentes.',
      currentIllnessHistory: 'Episódios recorrentes de pericoronarite no terceiro molar inferior direito (dente 48). Sem infecção ativa no momento.',
      medicalHistory: {
        hypertension: false,
        diabetes: false,
        cardiacProblems: false,
        bleedingDisorders: false,
        hepatitisOrHIV: false,
        asthmaOrRespiratory: false,
        pregnantOrLactating: false
      },
      allergies: ['Dipirona (náusea forte e urticária)'],
      continuousMedications: [],
      vitalSigns: {
        bloodPressure: '110x70 mmHg',
        heartRate: '68 bpm'
      },
      habits: {
        smoker: false,
        alcohol: false,
        bruxism: false,
        nailBiting: false
      }
    },
    odontogram: {
      38: {
        toothNumber: 38,
        conditions: [{ surface: 'G', condition: 'exodontia_indicada', notes: 'Semi-incluso mesioangulado.' }]
      },
      48: {
        toothNumber: 48,
        conditions: [{ surface: 'G', condition: 'exodontia_indicada', notes: 'Semi-incluso horizontal classe II B.' }]
      }
    },
    evolutions: [],
    exams: [
      {
        id: 'exam-4',
        title: 'Radiografia Panorâmica dos Maxilares',
        date: '2026-08-20',
        type: 'Panorâmica',
        imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
        notes: 'Presença dos quatro terceiros molares. Elemento 48 semi-incluso com proximidade do canal mandibular. Indicado cuidado cirúrgico na osteotomia.',
        teethReferenced: '18, 28, 38, 48',
        diagnosis: 'Indicação cirúrgica de exodontia profilática de 38 e 48',
        tags: ['Panorâmica', 'Cirurgia', 'Sisos']
      }
    ]
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'p1',
    patientName: 'Ana Carolina Mendes',
    patientPhone: '43991234567',
    date: '2026-08-28',
    startTime: '14:00',
    endTime: '16:00',
    discipline: 'Dentística Restauradora',
    procedure: 'Acabamento, polimento de resina dente 16 e aplicação tópica de flúor',
    boxNumber: 'Box 04',
    status: 'Confirmado',
    remindedViaWhatsApp: true,
    notes: 'Lembrar de levar pastas de polimento Diamond Excel e discos Sof-Lex.'
  },
  {
    id: 'apt-2',
    patientId: 'p2',
    patientName: 'Lucas Eduardo Silveira',
    patientPhone: '43999887766',
    date: '2026-08-29',
    startTime: '08:30',
    endTime: '11:30',
    discipline: 'Endodontia',
    procedure: 'Obturação do canal radicular dente 36 com guta-percha termoplastificada e cimento AH Plus',
    boxNumber: 'Box 12',
    status: 'Confirmado',
    remindedViaWhatsApp: true,
    notes: 'Separar condensadores de Schilder e cones de guta calibrados.'
  },
  {
    id: 'apt-3',
    patientId: 'p3',
    patientName: 'Juliana Beatriz Farias',
    patientPhone: '43997766554',
    date: '2026-09-01',
    startTime: '14:00',
    endTime: '17:00',
    discipline: 'Cirurgia Bucomaxilofacial',
    procedure: 'Exodontia cirúrgica de terceiro molar inferior incluso (Dente 48)',
    boxNumber: 'Box 02',
    status: 'Agendado',
    remindedViaWhatsApp: false,
    notes: 'Paciente alérgica à Dipirona! Prescrever Paracetamol 750mg ou Cetorolaco sublingual.'
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk-1',
    title: 'Autoclavar kits de bandejas clínicas para sexta-feira',
    description: '2 kits de isolamento absoluto, 2 kits de exame clínico e kit de cirurgia bucal com fita indicadora de esterilização.',
    category: 'Esterilização',
    dueDate: '2026-08-28',
    discipline: 'Dentística Restauradora',
    assignedTo: 'Dupla de Clínica',
    completed: true,
    priority: 'alta',
    createdAt: '2026-08-26T10:00:00.000Z'
  },
  {
    id: 'tsk-2',
    title: 'Comprar limas WaveOne Gold Small e cone de guta FM',
    description: 'Passar na dental antes da clínica de Endodontia na quinta.',
    category: 'Material de Aula',
    dueDate: '2026-08-28',
    discipline: 'Endodontia',
    assignedTo: 'Rafael (Você)',
    completed: false,
    priority: 'alta',
    createdAt: '2026-08-27T08:30:00.000Z'
  },
  {
    id: 'tsk-3',
    title: 'Assinar ficha de acompanhamento com Prof. Ricardo',
    description: 'Levar impresso o prontuário de Ana Carolina Mendes com a evolução da restauração do 16 para colher assinatura e nota.',
    category: 'Prontuário & Caso',
    dueDate: '2026-08-29',
    discipline: 'Dentística Restauradora',
    assignedTo: 'Ambos',
    completed: false,
    priority: 'media',
    createdAt: '2026-08-27T09:00:00.000Z'
  },
  {
    id: 'tsk-4',
    title: 'Estudar protocolo de exodontia de 3º molar semi-incluso',
    description: 'Revisar técnicas de odontossecção e incisão de Mead para a clínica de Cirurgia com a paciente Juliana.',
    category: 'Estudo/Prova',
    dueDate: '2026-08-31',
    discipline: 'Cirurgia Bucomaxilofacial',
    assignedTo: 'Rafael (Você)',
    completed: false,
    priority: 'media',
    createdAt: '2026-08-27T11:00:00.000Z'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'Minha Dupla',
    senderRole: 'Estudante B',
    content: 'E aí Rafael! Já esterilizei as caixas cirúrgicas e as pontas diamantadas para a clínica de amanhã.',
    timestamp: 'Ontem às 18:40'
  },
  {
    id: 'msg-2',
    sender: 'Rafael (Você)',
    senderRole: 'Estudante A',
    content: 'Perfeito! Eu já imprimi a ficha da Ana Carolina e confirmei a presença dela pelo WhatsApp.',
    timestamp: 'Ontem às 18:45'
  },
  {
    id: 'msg-3',
    sender: 'Minha Dupla',
    senderRole: 'Estudante B',
    content: 'Top! Lembra que o paciente das 08h30 de sexta é a obturação do canal com a Profa. Mariana. Você comprou o cimento AH Plus?',
    timestamp: 'Hoje às 09:12'
  },
  {
    id: 'msg-4',
    sender: 'Rafael (Você)',
    senderRole: 'Estudante A',
    content: 'Sim, peguei na dental ontem junto com os cones de guta. Tá tudo pronto no armário 14 da faculdade!',
    timestamp: 'Hoje às 09:15'
  }
];

export const INITIAL_NOTICES: AcademicNotice[] = [
  {
    id: 'not-1',
    title: 'Prazo de entrega das Fichas de Dentística (1º Bimestre)',
    discipline: 'Dentística Restauradora',
    date: '2026-09-05',
    type: 'Entrega de Ficha',
    description: 'Todas as fichas clínicas assinadas com notas de preparo e restauração devem ser protocoladas na secretaria até 17h.',
    isRead: false
  },
  {
    id: 'not-2',
    title: 'Prova Prática de Anestesiologia & Cirurgia Ambulatorial',
    discipline: 'Cirurgia Bucomaxilofacial',
    date: '2026-09-12',
    type: 'Prova Prática',
    description: 'Avaliação individual de técnicas anestésicas (bloqueio do NAI, infiltrativas e bloqueio do infraorbitário).',
    isRead: false
  },
  {
    id: 'not-3',
    title: 'Seminário de Apresentação de Casos Clínicos de Endodontia',
    discipline: 'Endodontia',
    date: '2026-09-18',
    type: 'Seminário',
    description: 'Apresentação de 1 caso de dente birradicular com fotos, tomografia/periapicais e relato da conduta adotada.',
    isRead: true
  }
];

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
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result);
        } else {
          // Fallback to localStorage if available
          const localVal = localStorage.getItem(key);
          if (localVal) {
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
        const localVal = localStorage.getItem(key);
        if (localVal) {
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
    const localVal = localStorage.getItem(key);
    if (localVal) {
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
  try {
    // Save to localStorage as backup
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignored if local storage exceeds quota, IndexedDB will handle large image blobs
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB, fallback to localStorage only:', err);
  }
}
