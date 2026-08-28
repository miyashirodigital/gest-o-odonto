import { Patient, Appointment } from '../types';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Lembrete de Consulta' | 'Confirmação' | 'Pós-Operatório' | 'Orientações Gerais';
  generateText: (patient: Patient, appointment?: Appointment, studentName?: string) => string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'lembrete_consulta',
    title: 'Lembrete de Consulta Odontológica',
    description: 'Envia data, horário, clínica da faculdade e orientações prévias.',
    category: 'Lembrete de Consulta',
    generateText: (patient, appointment, studentName = 'Rafael') => {
      const dateStr = appointment?.date ? new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'data marcada';
      const timeStr = appointment?.startTime ? `${appointment.startTime}h` : 'horário agendado';
      const boxStr = appointment?.boxNumber ? ` (${appointment.boxNumber})` : '';
      const discipline = appointment?.discipline || patient.discipline;

      return `🦷 *LEMBRETE DE ATENDIMENTO ODONTOLÓGICO* 🦷\n\n` +
        `Olá, *${patient.name.split(' ')[0]}*! Tudo bem?\n\n` +
        `Aqui é o acadêmico *${studentName}*, da Clínica Odontológica Universitária.\n\n` +
        `Passando para lembrar da sua consulta agendada:\n` +
        `📅 *Data:* ${dateStr}\n` +
        `⏰ *Horário:* ${timeStr}\n` +
        `📍 *Local:* Clínica Universitária de Odontologia${boxStr}\n` +
        `🏥 *Disciplina:* ${discipline}\n\n` +
        `*Orientações importantes:*\n` +
        `1. Por favor, chegue com 15 minutos de antecedência.\n` +
        `2. Traga um documento oficial com foto e sua escova de dentes.\n` +
        `3. Tome seus medicamentos de rotina normalmente (exceto se orientado o contrário).\n\n` +
        `Você confirma sua presença? Por favor, responda com *SIM* para garantir o seu horário! 🙏\n\n` +
        `Qualquer dúvida estou à disposição!`;
    }
  },
  {
    id: 'confirmacao_urgente',
    title: 'Confirmação Rápida de Presença',
    description: 'Mensagem curta e direta para o paciente confirmar ou reagendar.',
    category: 'Confirmação',
    generateText: (patient, appointment, studentName = 'Rafael') => {
      const dateStr = appointment?.date ? new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'sua consulta';
      const timeStr = appointment?.startTime || '';

      return `Olá, *${patient.name.split(' ')[0]}*! Aqui é o acadêmico *${studentName}* da Odontologia.\n\n` +
        `Gostaria de confirmar se você poderá comparecer ao seu atendimento dia *${dateStr} às ${timeStr}* na clínica da faculdade.\n\n` +
        `Como os atendimentos acadêmicos têm vagas limitadas e dependem de avaliação dos professores, sua confirmação é fundamental para reservarmos a cadeira clínica. 🦷✨\n\n` +
        `*Podemos contar com sua presença?*`;
    }
  },
  {
    id: 'pos_operatorio_cirurgia',
    title: 'Orientações Pós-Operatórias (Cirurgia / Extração)',
    description: 'Cuidados essenciais após extração dentária ou cirurgia bucal.',
    category: 'Pós-Operatório',
    generateText: (patient, _appointment, studentName = 'Rafael') => {
      return `🩺 *CUIDADOS PÓS-OPERATÓRIOS IMPORTANTES* 🩺\n\n` +
        `Olá, *${patient.name.split(' ')[0]}*! Aqui é o *${studentName}*.\n\n` +
        `Para garantir uma cicatrização rápida e sem complicações do seu procedimento de hoje, siga com atenção estas orientações:\n\n` +
        `❄️ *Gelo:* Faça compressas frias por fora da bochecha (20min sim, 20min não) nas primeiras 24 horas.\n` +
        `🍲 *Alimentação:* Somente alimentos líquidos/pastosos, frios ou mornos (sucos, sopas batidas, iogurtes, sorvetes). Evite comidas quentes ou duras.\n` +
        `🚫 *Proibido:* NÃO faça bochechos, cuspir, tomar de canudinho ou fumar nas primeiras 48h (isso pode deslocar o coágulo).\n` +
        `🛌 *Repouso:* Mantenha repouso físico e durma com a cabeça levemente mais elevada.\n` +
        `💊 *Medicamentos:* Tome os remédios prescritos nos horários rigorosamente certos.\n\n` +
        `Se sentir qualquer dor intensa ou sangramento contínuo, me envie uma mensagem imediatamente! Tenha uma excelente recuperação! 🌟`;
    }
  },
  {
    id: 'pos_operatorio_restauracao',
    title: 'Cuidados Pós-Restauração / Endodontia',
    description: 'Instruções após restaurações dentárias ou tratamento de canal.',
    category: 'Pós-Operatório',
    generateText: (patient, _appointment, studentName = 'Rafael') => {
      return `✨ *ORIENTAÇÕES APÓS O ATENDIMENTO* ✨\n\n` +
        `Olá, *${patient.name.split(' ')[0]}*!\n\n` +
        `Aqui estão algumas orientações sobre o procedimento realizado hoje no dente:\n\n` +
        `1. ⌛ *Anestesia:* Tome muito cuidado para não morder os lábios, língua ou bochecha enquanto a anestesia estiver passando (leva de 2 a 3 horas).\n` +
        `2. 🦷 *Sensibilidade:* É normal uma leve sensibilidade nos primeiros dias ao mastigar. Se a mordida parecer "alta", me avise para fazermos um ajuste fino rápido.\n` +
        `3. 🪥 *Higiene:* Continue escovando com carinho e usando o fio dental normalmente!\n\n` +
        `Obrigado pela sua colaboração com nosso aprendizado acadêmico! Um grande abraço, *${studentName}*.`;
    }
  },
  {
    id: 'agradecimento_caso',
    title: 'Agradecimento e Próximos Passos',
    description: 'Agradece a confiança e indica próximos retornos.',
    category: 'Orientações Gerais',
    generateText: (patient, _appointment, studentName = 'Rafael') => {
      return `Olá, *${patient.name.split(' ')[0]}*!\n\n` +
        `Passando para agradecer imensamente pela sua pontualidade e colaboração durante nosso atendimento de hoje na Clínica Odontológica. Seu caso clínico foi muito importante para a nossa formação profissional! 🎓🦷\n\n` +
        `Assim que abrirmos a agenda da próxima matéria clínica, entrarei em contato para darmos continuidade ao seu tratamento!\n\n` +
        `Com carinho, *${studentName}* e Equipe Odonto.`;
    }
  }
];

export function cleanPhoneForWhatsApp(phone: string): string {
  // Remove non-numeric chars
  const numeric = phone.replace(/\D/g, '');
  if (numeric.startsWith('55')) {
    return numeric;
  }
  if (numeric.length >= 10) {
    return `55${numeric}`;
  }
  return numeric;
}

export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
