/*
 * Modelo de lectura del panel del veterinario (o de la clínica).
 * Solo datos para mostrar, armados con Profiles (clínica, pacientes, dueños),
 * Clinical Attention (consultas) y Clinical Exams (exámenes de la clínica).
 * Los textos son claves de i18n; la vista los traduce con sus parámetros.
 */
import { IconName } from '../../../presentation/components/icon/icon';

export interface Kpi {
  label: string; // clave i18n: "dashboard.vet.kpi.attended"
  value: number;
  unit: string; // clave i18n
  hint: string; // clave i18n
  hintParams?: Record<string, unknown>;
  icon: IconName;
  highlight?: boolean; // la tarjeta que pide atención
}

/** waiting = consulta por iniciar, in-progress = en atención, ok = sin consulta abierta. */
export type PatientStatus = 'waiting' | 'in-progress' | 'ok';

export interface TodayPatient {
  petId: number;
  code: string; // "#PET-97420"
  name: string;
  species: 'Canino' | 'Felino' | 'Otro';
  ageYears: number | null;
  weightKg?: number; // peso de la última evaluación fisiológica
  breed: string;
  photoUrl?: string;
  ownerName: string;
  ownerPhone: string;
  status: PatientStatus;
  statusText: string; // clave i18n de la franja superior
  statusParams?: Record<string, unknown>;
  noteTitle: string; // clave i18n
  noteDate?: Date;
  note: string; // motivo de la consulta (texto del backend)
  primaryAction: string; // clave i18n del botón principal
  primaryLink: (string | number)[]; // a dónde lleva el botón principal
  primaryQuery?: Record<string, unknown>;
}

export interface PendingExam {
  id: number;
  type: string; // ExamType: RADIOGRAPHY, LABORATORY...
  patient: string;
  consultationId: number;
  status: string; // ExamStatus: REQUESTED o IN_PROCESS
  needsValidation: boolean; // tiene resultado registrado sin validar
}

export interface RecentConsultation {
  id: number;
  patient: string;
  reason: string;
  date: Date;
}

/** Consulta en curso que puede usar el asistente clínico (null si no hay ninguna). */
export interface OngoingConsultation {
  id: number;
  patient: string;
}

export interface VetDashboard {
  vetLastName: string;
  clinic: string;
  patientCount: number;
  waitingNow: number; // consultas creadas, sin iniciar
  syncedAt: string; // "10:24"
  kpis: Kpi[];
  patients: TodayPatient[];
  exams: PendingExam[];
  recent: RecentConsultation[];
  ongoing: OngoingConsultation | null;
}
