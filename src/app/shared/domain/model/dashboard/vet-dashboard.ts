/*
 * Modelo de lectura del panel del veterinario (o de la clínica).
 * Igual que el del dueño: solo datos para mostrar, armados desde Clinical Attention,
 * Clinical Exams, Profiles y AI Assistance.
 */

export interface Kpi {
  label: string;              // "ATENDIDOS HOY"
  value: number;
  unit: string;               // "pacientes"
  hint: string;               // "+2 vs ayer"
  icon: 'users' | 'clock' | 'stethoscope' | 'flask';
  highlight?: boolean;        // la tarjeta que pide atención (sala de espera)
}

export type PatientStatus = 'waiting' | 'alert' | 'ok';

export interface TodayPatient {
  code: string;               // "#PET-97420"
  name: string;
  species: 'Canino' | 'Felino';
  breed: string;
  ageYears: number;
  weightKg: number;
  photoUrl?: string;
  ownerName: string;
  ownerPhone: string;
  status: PatientStatus;
  statusText: string;         // franja superior de la tarjeta
  noteTitle: string;          // "MOTIVO DE INGRESO", "ÚLTIMA EVOLUCIÓN (12 SEP 2026)"
  note: string;
  primaryAction: string;      // "Iniciar consulta", "Nueva consulta"
}

export interface PendingExam {
  name: string;
  patient: string;
  lab: string;
  status: 'En proceso' | 'Solicitado';
}

export interface RecentConsultation {
  patient: string;
  reason: string;
  date: string;
}

export interface AiSuggestion {
  text: string;
}

export interface VetDashboard {
  vetLastName: string;        // "Mendoza"
  clinic: string;             // "VetSur · Sede Miraflores"
  scheduledToday: number;
  waitingNow: number;
  syncedAt: string;           // "10:24 AM"
  kpis: Kpi[];
  patients: TodayPatient[];
  exams: PendingExam[];
  recent: RecentConsultation[];
  aiSuggestion: AiSuggestion;
}
