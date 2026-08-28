import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, ClinicalEvolution } from '../types';

export function exportPatientClinicalRecordPDF(patient: Patient, studentName: string = 'Rafael Miyasiro', university: string = 'Universidade Estadual de Londrina (UEL) - Curso de Odontologia') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryGreen: [number, number, number] = [5, 150, 105]; // #059669
  const darkSlate: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [241, 245, 249];
  const alertRed: [number, number, number] = [225, 29, 72];

  // Header Banner
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PRONTUÁRIO CLÍNICO ODONTOLÓGICO ACADÊMICO', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${university} | Clínica Escola de Odontologia`, 14, 18);
  doc.text(`Prontuário Nº: ${patient.recordNumber}`, 155, 11);
  doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 155, 18);

  let currentY = 32;

  // Patient Identification Box
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, 'F');

  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DE IDENTIFICAÇÃO DO PACIENTE', 18, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome Completo: ${patient.name}`, 18, currentY + 13);
  doc.text(`CPF: ${patient.cpf}`, 120, currentY + 13);
  doc.text(`Data Nasc.: ${new Date(patient.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')} (${calculateAge(patient.birthDate)} anos) | Gênero: ${patient.gender}`, 18, currentY + 20);
  doc.text(`Telefone: ${patient.phone}`, 120, currentY + 20);
  doc.text(`Endereço: ${patient.address || 'Não informado'}`, 18, currentY + 27);
  doc.text(`Contato Emergência: ${patient.emergencyContact || 'Não informado'}`, 120, currentY + 27);

  currentY += 40;

  // Anamnesis & Medical Alert Box
  const hasAllergies = patient.anamnese.allergies && patient.anamnese.allergies.length > 0;
  
  if (hasAllergies) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...alertRed);
    doc.roundedRect(14, currentY, 182, 12, 1, 1, 'FD');
    doc.setTextColor(...alertRed);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`⚠️ ALERTA MÉDICO / ALERGIAS: ${patient.anamnese.allergies.join(', ')}`, 18, currentY + 8);
    currentY += 16;
  }

  // Anamnesis Summary
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, currentY, 182, 44, 2, 2, 'F');
  
  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. ANAMNESE E HISTÓRIA MÉDICA', 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Queixa Principal: "${patient.anamnese.chiefComplaint}"`, 18, currentY + 13, { maxWidth: 174 });
  doc.text(`História da Moléstia Atual: "${patient.anamnese.currentIllnessHistory || 'Sem outras queixas associadas.'}"`, 18, currentY + 21, { maxWidth: 174 });
  
  const medHistory = [];
  if (patient.anamnese.medicalHistory.hypertension) medHistory.push('Hipertensão');
  if (patient.anamnese.medicalHistory.diabetes) medHistory.push('Diabetes');
  if (patient.anamnese.medicalHistory.cardiacProblems) medHistory.push('Cardiopatia');
  if (patient.anamnese.medicalHistory.bleedingDisorders) medHistory.push('Distúrbio Hemorrágico');
  if (patient.anamnese.medicalHistory.asthmaOrRespiratory) medHistory.push('Asma/Respiratório');
  if (patient.anamnese.medicalHistory.pregnantOrLactating) medHistory.push('Gestante/Lactante');
  
  const medHistText = medHistory.length > 0 ? medHistory.join(', ') : 'Nenhuma alteração sistêmica relatada.';
  doc.text(`Condições Sistêmicas: ${medHistText}`, 18, currentY + 29);
  
  const meds = patient.anamnese.continuousMedications.length > 0 ? patient.anamnese.continuousMedications.join(', ') : 'Nenhum medicamento contínuo.';
  doc.text(`Medicamentos em Uso: ${meds}`, 18, currentY + 35);
  
  const pa = patient.anamnese.vitalSigns?.bloodPressure ? `PA: ${patient.anamnese.vitalSigns.bloodPressure}` : 'PA: Não aferida';
  const fc = patient.anamnese.vitalSigns?.heartRate ? ` | FC: ${patient.anamnese.vitalSigns.heartRate}` : '';
  doc.text(`Sinais Vitais: ${pa}${fc}`, 18, currentY + 41);

  currentY += 50;

  // Odontogram & Dental Evaluation
  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ODONTOGRAMA & DIAGNÓSTICO DOS ELEMENTOS DENTÁRIOS', 14, currentY);

  const odontogramRows: string[][] = [];
  Object.entries(patient.odontogram).forEach(([toothNum, data]) => {
    const conds = data.conditions.map(c => `${c.surface ? `[${c.surface}] ` : ''}${formatCondition(c.condition)}`).join('; ');
    odontogramRows.push([
      `Dente ${toothNum}`,
      conds || formatCondition(data.generalCondition || 'higido'),
      data.notes || '-'
    ]);
  });

  if (odontogramRows.length === 0) {
    odontogramRows.push(['Todos os elementos', 'Arcadas hígidas sem patologias ativas detectadas', 'Avaliação inicial']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Elemento', 'Condição / Faces Acometidas', 'Observações Clínicas & Conduta']],
    body: odontogramRows,
    theme: 'grid',
    headStyles: { fillColor: primaryGreen, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: darkSlate },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 10;

  // Clinical Evolutions Table
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('4. HISTÓRICO DE EVOLUÇÃO CLÍNICA & PROCEDIMENTOS REALIZADOS', 14, currentY);

  const evolutionRows = patient.evolutions.map((evo: ClinicalEvolution) => [
    new Date(evo.date + 'T12:00:00').toLocaleDateString('pt-BR'),
    evo.discipline,
    `${evo.procedureDone}\n${evo.anestheticUsed ? `Anestesia: ${evo.anestheticUsed} (${evo.tubesUsed || 1} tubete(s))` : ''}\n${evo.postOpObservations ? `Obs pós: ${evo.postOpObservations}` : ''}`,
    `${evo.professor}\n${evo.evaluatedGrade ? `Nota: ${evo.evaluatedGrade}` : (evo.signedByProfessor ? 'Visto: [OK]' : 'Pendente')}`
  ]);

  if (evolutionRows.length === 0) {
    evolutionRows.push(['-', 'Triagem', 'Nenhum procedimento registrado até o momento.', '-']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Data', 'Disciplina', 'Descrição do Procedimento & Conduta', 'Supervisor / Visto']],
    body: evolutionRows,
    theme: 'striped',
    headStyles: { fillColor: primaryGreen, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: darkSlate },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 85 },
      3: { cellWidth: 40 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 16;

  if (currentY > 240) {
    doc.addPage();
    currentY = 30;
  }

  // Signatures Section
  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY, 68, currentY);
  doc.line(78, currentY, 132, currentY);
  doc.line(142, currentY, 196, currentY);

  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text(`Acadêmico Responsável\n${studentName}`, 41, currentY + 4, { align: 'center' });
  doc.text(`Dupla de Clínica\nOdontologia UEL`, 105, currentY + 4, { align: 'center' });
  doc.text(`Professor(a) Supervisor(a)\nAssinatura & Carimbo CRO`, 169, currentY + 4, { align: 'center' });

  // Save / Download PDF
  const safeName = patient.name.replace(/\s+/g, '_').toLowerCase();
  doc.save(`prontuario_${safeName}_${patient.recordNumber.replace(/[\/\\]/g, '-')}.pdf`);
}

export function exportAcademicReportPDF(
  disciplines: any[],
  patients: Patient[],
  studentName: string = 'Rafael Mendes de Oliveira',
  semester: string = '8º Período - Odontologia'
) {
  const doc = new jsPDF();
  const primaryGreen: [number, number, number] = [5, 150, 105];
  const darkSlate: [number, number, number] = [30, 41, 59];

  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO ACADÊMICO INTEGRADO DE CLÍNICA ODONTOLÓGICA', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Acadêmico: ${studentName} | ${semester}`, 14, 18);
  doc.text(`Total de Pacientes Ativos: ${patients.length} | Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 23);

  // Table 1: Disciplines Progress
  const discRows = disciplines.map(d => {
    const completed = d.completedProcedures ?? d.completedCount ?? 0;
    const required = d.requiredProcedures ?? d.targetCount ?? 10;
    const percent = Math.min(Math.round((completed / Math.max(required, 1)) * 100), 100);
    return [
      d.name || 'Disciplina',
      d.professor || 'Docente Responsável',
      `${completed} de ${required}`,
      `${percent}%`,
      completed >= required ? 'Meta Concluída' : 'Em Andamento'
    ];
  });

  doc.setTextColor(...darkSlate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. CUMPRIMENTO DE METAS POR DISCIPLINA CLÍNICA', 14, 34);

  autoTable(doc, {
    startY: 37,
    head: [['Disciplina', 'Professor Responsável', 'Procedimentos', '% Meta', 'Status']],
    body: discRows,
    theme: 'grid',
    headStyles: { fillColor: primaryGreen, fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkSlate },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  let currentY = doc.lastAutoTable.finalY + 12;

  // Table 2: Clinical Evolutions
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. HISTÓRICO GERAL DE ATENDIMENTOS E EVOLUÇÕES REALIZADAS', 14, currentY);

  const evoRows: string[][] = [];
  patients.forEach(p => {
    p.evolutions.forEach(evo => {
      evoRows.push([
        new Date(evo.date + 'T12:00:00').toLocaleDateString('pt-BR'),
        p.name,
        p.recordNumber,
        evo.discipline,
        evo.procedureDone,
        evo.professor,
        evo.evaluatedGrade || (evo.signedByProfessor ? 'Aprovado' : 'Pendente')
      ]);
    });
  });

  if (evoRows.length === 0) {
    evoRows.push(['-', '-', '-', '-', 'Nenhum procedimento concluído', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Data', 'Paciente', 'Prontuário', 'Disciplina', 'Procedimento', 'Docente', 'Nota']],
    body: evoRows,
    theme: 'striped',
    headStyles: { fillColor: primaryGreen, fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: darkSlate },
    margin: { left: 14, right: 14 }
  });

  doc.save(`relatorio_academico_${studentName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}

export function exportAcademicSummaryPDF(patients: Patient[], studentName: string = 'Rafael Miyasiro') {
  const doc = new jsPDF();
  const primaryGreen: [number, number, number] = [5, 150, 105];
  const darkSlate: [number, number, number] = [30, 41, 59];

  doc.setFillColor(...primaryGreen);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO ACADÊMICO DE PROCEDIMENTOS CLÍNICOS', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Acadêmico: ${studentName} | Relatório de Acompanhamento Semestral`, 14, 18);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 155, 18);

  const rows: string[][] = [];
  patients.forEach(p => {
    p.evolutions.forEach(evo => {
      rows.push([
        new Date(evo.date + 'T12:00:00').toLocaleDateString('pt-BR'),
        p.name,
        p.recordNumber,
        evo.discipline,
        evo.procedureDone,
        evo.evaluatedGrade || (evo.signedByProfessor ? 'Aprovado' : 'Pendente')
      ]);
    });
  });

  autoTable(doc, {
    startY: 32,
    head: [['Data', 'Paciente', 'Prontuário', 'Disciplina', 'Procedimento Realizado', 'Avaliação']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: primaryGreen, fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkSlate },
    margin: { left: 14, right: 14 }
  });

  doc.save(`relatorio_academico_odonto_${studentName.replace(/\s+/g, '_')}.pdf`);
}

function calculateAge(birthDateStr: string): number {
  const today = new Date();
  const birthDate = new Date(birthDateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    higido: 'Hígido',
    carie: 'Cárie',
    restauracao_resina: 'Restauração em Resina',
    restauracao_amalgama: 'Restauração em Amálgama',
    tratamento_canal: 'Tratamento Endodôntico (Canal)',
    coroa_protese: 'Coroa / Prótese Fixa',
    exodontia_indicada: 'Exodontia Indicada',
    ausente: 'Ausente / Extraído',
    implante: 'Implante Dentário',
    selante: 'Selante',
    fratura: 'Fratura Coronária'
  };
  return map[condition] || condition;
}
