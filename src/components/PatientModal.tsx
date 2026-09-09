import React, { useState, useRef } from 'react';
import { Patient, DisciplineType } from '../types';
import { X, UserPlus, AlertTriangle, ShieldCheck, HeartPulse, Sparkles, Camera, Image, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PatientModalProps {
  patient?: Patient;
  onClose: () => void;
}

export const PatientModal: React.FC<PatientModalProps> = ({ patient, onClose }) => {
  const { addPatient, updatePatient, disciplines, showToast } = useApp();

  const [activeStep, setActiveStep] = useState<'dados' | 'anamnese' | 'alergias'>('dados');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dados Gerais
  const [photoUrl, setPhotoUrl] = useState<string>(patient?.photoUrl || '');
  const [name, setName] = useState<string>(patient?.name || '');
  const [cpf, setCpf] = useState<string>(patient?.cpf || '');
  const [rg, setRg] = useState<string>(patient?.rg || '');
  const [birthDate, setBirthDate] = useState<string>(patient?.birthDate || '2000-01-01');
  const [gender, setGender] = useState<Patient['gender']>(patient?.gender || 'Feminino');
  const [phone, setPhone] = useState<string>(patient?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState<string>(patient?.emergencyContact || '');
  const [recordNumber, setRecordNumber] = useState<string>(patient?.recordNumber || `UEL-2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [discipline, setDiscipline] = useState<DisciplineType>(patient?.discipline || 'Dentística Restauradora');
  const [address, setAddress] = useState<string>(patient?.address || '');

  // Anamnese
  const [chiefComplaint, setChiefComplaint] = useState<string>(patient?.anamnese?.chiefComplaint || '');
  const [currentIllnessHistory, setCurrentIllnessHistory] = useState<string>(patient?.anamnese?.currentIllnessHistory || '');
  const [lastDentalVisit, setLastDentalVisit] = useState<string>(patient?.anamnese?.lastDentalVisit || '');

  // Medical conditions
  const [hypertension, setHypertension] = useState<boolean>(patient?.anamnese?.medicalHistory?.hypertension || false);
  const [diabetes, setDiabetes] = useState<boolean>(patient?.anamnese?.medicalHistory?.diabetes || false);
  const [cardiacProblems, setCardiacProblems] = useState<boolean>(patient?.anamnese?.medicalHistory?.cardiacProblems || false);
  const [bleedingDisorders, setBleedingDisorders] = useState<boolean>(patient?.anamnese?.medicalHistory?.bleedingDisorders || false);
  const [hepatitisOrHIV, setHepatitisOrHIV] = useState<boolean>(patient?.anamnese?.medicalHistory?.hepatitisOrHIV || false);
  const [asthmaOrRespiratory, setAsthmaOrRespiratory] = useState<boolean>(patient?.anamnese?.medicalHistory?.asthmaOrRespiratory || false);
  const [pregnantOrLactating, setPregnantOrLactating] = useState<boolean>(patient?.anamnese?.medicalHistory?.pregnantOrLactating || false);
  const [otherConditions, setOtherConditions] = useState<string>(patient?.anamnese?.medicalHistory?.otherConditions || '');

  // Allergies & Meds
  const [allergiesText, setAllergiesText] = useState<string>(patient?.anamnese?.allergies ? patient.anamnese.allergies.join(', ') : '');
  const [medicationsText, setMedicationsText] = useState<string>(patient?.anamnese?.continuousMedications ? patient.anamnese.continuousMedications.join(', ') : '');
  const [bloodPressure, setBloodPressure] = useState<string>(patient?.anamnese?.vitalSigns?.bloodPressure || '120x80 mmHg');
  const [heartRate, setHeartRate] = useState<string>(patient?.anamnese?.vitalSigns?.heartRate || '75 bpm');

  // Habits
  const [smoker, setSmoker] = useState<boolean>(patient?.anamnese?.habits?.smoker || false);
  const [alcohol, setAlcohol] = useState<boolean>(patient?.anamnese?.habits?.alcohol || false);
  const [bruxism, setBruxism] = useState<boolean>(patient?.anamnese?.habits?.bruxism || false);
  const [nailBiting, setNailBiting] = useState<boolean>(patient?.anamnese?.habits?.nailBiting || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim()) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }

    const allergies = allergiesText.split(',').map(a => a.trim()).filter(Boolean);
    const continuousMedications = medicationsText.split(',').map(m => m.trim()).filter(Boolean);

    const payload = {
      photoUrl: photoUrl || undefined,
      name,
      cpf,
      rg,
      birthDate,
      gender,
      phone,
      emergencyContact,
      recordNumber,
      discipline,
      address,
      consentSigned: patient?.consentSigned ?? true,
      consentSignatureDate: patient?.consentSignatureDate || new Date().toISOString().split('T')[0],
      anamnese: {
        chiefComplaint: chiefComplaint || 'Avaliação clínica e tratamento odontológico de rotina.',
        currentIllnessHistory,
        medicalHistory: {
          hypertension,
          diabetes,
          cardiacProblems,
          bleedingDisorders,
          hepatitisOrHIV,
          asthmaOrRespiratory,
          pregnantOrLactating,
          otherConditions
        },
        allergies,
        continuousMedications,
        vitalSigns: {
          bloodPressure,
          heartRate
        },
        habits: {
          smoker,
          alcohol,
          bruxism,
          nailBiting
        },
        lastDentalVisit
      },
      odontogram: patient?.odontogram || {},
      evolutions: patient?.evolutions || [],
      exams: patient?.exams || []
    };

    if (patient) {
      updatePatient(patient.id, payload);
    } else {
      addPatient(payload);
    }

    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      showToast('Foto do paciente carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {patient ? 'Editar Prontuário do Paciente' : 'Cadastrar Novo Paciente na Clínica'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histórico clínico e anamnese acadêmica em conformidade com sigilo profissional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep('dados')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeStep === 'dados'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            1. Dados Pessoais & Foto
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('anamnese')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeStep === 'anamnese'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            2. Anamnese & Queixa
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('alergias')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeStep === 'alergias'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            3. Alergias, Saúde & Sinais
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {activeStep === 'dados' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Photo Upload Section */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Foto do paciente"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                      {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('') : <Camera className="w-6 h-6 text-emerald-600" />}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Foto de Perfil do Paciente (Opcional)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Adicione uma foto de rosto para facilitar a identificação visual na clínica e no prontuário.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" /> Escolher Foto
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Paciente * :
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Mariana Ferreira de Souza"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF (Obrigatório para Prontuário) * :
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Nascimento:
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gênero:
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Patient['gender'])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp * :
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(43) 99999-9999"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nº de Prontuário Acadêmico:
                  </label>
                  <input
                    type="text"
                    value={recordNumber}
                    onChange={(e) => setRecordNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Disciplina Principal de Encaminhamento:
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Residencial:
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro e cidade"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contato de Emergência (Nome e Telefone):
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Mãe / Cônjuge (43) 98888-8888"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 'anamnese' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Queixa Principal (Palavras do Paciente):
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Ex: 'Sinto dor no dente do fundo quando bebo gelado e mastigo doce há 2 semanas.'"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  História da Moléstia Atual (HMA):
                </label>
                <textarea
                  rows={3}
                  value={currentIllnessHistory}
                  onChange={(e) => setCurrentIllnessHistory(e.target.value)}
                  placeholder="Ex: Início súbito ou gradual, intensidade da dor, fatores de alívio e agravo, uso de analgésicos prévios..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Última Visita ao Cirurgião-Dentista:
                </label>
                <input
                  type="text"
                  value={lastDentalVisit}
                  onChange={(e) => setLastDentalVisit(e.target.value)}
                  placeholder="Ex: Há 1 ano para profilaxia / Nunca realizou tratamento prévio"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Habits */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Hábitos & Parafunções:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Tabagismo', checked: smoker, set: setSmoker },
                    { label: 'Etilismo', checked: alcohol, set: setAlcohol },
                    { label: 'Bruxismo/Aperto', checked: bruxism, set: setBruxism },
                    { label: 'Onicofagia (Roer unhas)', checked: nailBiting, set: setNailBiting }
                  ].map((h, idx) => (
                    <label
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        h.checked
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={h.checked}
                        onChange={(e) => h.set(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium">{h.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'alergias' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* High Alert Banner for Allergies */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <label className="block font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Alergias Medicamentosas ou de Contato (Destacadas em Vermelho no Prontuário):
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="Ex: Penicilina, Dipirona, Látex, Sulfa, Iodo, Anestésico com vaso (separe por vírgula)"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medicamentos de Uso Contínuo:
                </label>
                <input
                  type="text"
                  value={medicationsText}
                  onChange={(e) => setMedicationsText(e.target.value)}
                  placeholder="Ex: Losartana 50mg, Metformina 850mg, Levotiroxina 50mcg..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Pressão Arterial Aferida:
                  </label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="Ex: 120x80 mmHg"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frequência Cardíaca (BPM):
                  </label>
                  <input
                    type="text"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="Ex: 72 bpm"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Systemic Conditions Grid */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Condições Sistêmicas Relevantes:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Hipertensão Arterial', val: hypertension, set: setHypertension },
                    { label: 'Diabetes Mellitus', val: diabetes, set: setDiabetes },
                    { label: 'Cardiopatia / Valvulopatia', val: cardiacProblems, set: setCardiacProblems },
                    { label: 'Distúrbio Hemorrágico', val: bleedingDisorders, set: setBleedingDisorders },
                    { label: 'Asma / DPOC / Respiratório', val: asthmaOrRespiratory, set: setAsthmaOrRespiratory },
                    { label: 'Gestante / Lactante', val: pregnantOrLactating, set: setPregnantOrLactating }
                  ].map((c, idx) => (
                    <label
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        c.val
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={c.val}
                        onChange={(e) => c.set(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-medium text-[11px]">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Outras Condições Médicas / Observações Clínicas:
                </label>
                <input
                  type="text"
                  value={otherConditions}
                  onChange={(e) => setOtherConditions(e.target.value)}
                  placeholder="Ex: Portador de prótese valvar, fobia de anestesia, histórico de convulsões..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {activeStep !== 'dados' && (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep === 'alergias' ? 'anamnese' : 'dados')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Voltar
                </button>
              )}
              {activeStep !== 'alergias' && (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep === 'dados' ? 'anamnese' : 'alergias')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  Avançar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {patient ? 'Salvar Alterações' : 'Concluir Cadastro do Paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
