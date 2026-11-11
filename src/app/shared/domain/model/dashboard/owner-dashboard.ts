/*
 * Modelo de lectura del panel del dueño de mascota.
 * Vive en shared porque no es un bounded context: junta datos que ya existen en otros contextos
 * (Profiles: mascotas; Clinical Attention: consultas; Clinical Exams: exámenes y resultados).
 * Lo que todavía no tiene backend (tratamientos, alertas de la historia clínica, cuota de IA)
 * llega en null y la vista muestra "Próximamente".
 */

/** Etiqueta de estado de una mascota. label es una clave de i18n. */
export interface PetTag {
  label: string;
  params?: Record<string, unknown>;
  tone: 'success' | 'danger' | 'neutral';
}

export interface PetSummary {
  id: number;
  name: string;
  species: string; // clave i18n: enums.species.DOG
  breed: string;
  ageYears: number | null; // null si la mascota no tiene fecha de nacimiento
  weightKg?: number; // peso de la última evaluación fisiológica
  photoUrl?: string; // opcional: si no hay foto se muestra la inicial
  active: boolean; // tiene una consulta en curso
  verified: boolean; // tiene al menos una consulta completada
  tags: PetTag[];
}

export interface ClinicalAlert {
  title: string;
  detail: string;
  badge: string;
}

export interface Medication {
  name: string;
  posology: string;
  note: string;
  dosesPerDay: number;
}

export interface ActiveTreatment {
  prescriptionCode: string;
  route: string;
  title: string;
  prescribedBy: string;
  startedAt: string;
  totalDays: number;
  currentDay: number;
  dosesTaken: number;
  medication: Medication;
  nextDose: string;
}

/** Algo pendiente de una mascota: una consulta por iniciar o en curso, o un examen sin resultado. */
export interface UpcomingEvent {
  kind: 'consultation' | 'exam';
  date: Date;
  title: string; // clave i18n
  examType?: string; // ExamType, solo para exámenes
  detail: string; // texto del backend (motivo) o clave i18n
  pet: string;
  badge: string; // clave i18n del estado
  link: (string | number)[];
  query?: Record<string, unknown>;
}

/** Resultado de examen ya validado por el veterinario. */
export interface ReadyResult {
  examId: number;
  petId: number;
  pet: string;
  type: string; // ExamType
  summary: string;
  date: string; // fecha del resultado (yyyy-MM-dd)
}

export interface AiUsage {
  label: string;
  used: number;
  limit: number;
  hint: string;
}

export interface AiQuota {
  plan: string;
  cycle: string;
  renewsInDays: number;
  usages: AiUsage[];
}

export interface AssignedVet {
  name: string;
  license: string;
  clinic: string;
}

export interface OwnerDashboard {
  ownerFirstName: string;
  pets: PetSummary[];
  alert: ClinicalAlert | null; // Historia clínica: aún no existe
  treatment: ActiveTreatment | null; // Tratamientos: aún no existe
  events: UpcomingEvent[];
  results: ReadyResult[];
  aiQuota: AiQuota | null; // Suscripciones: aún no existe
  assignedVet: AssignedVet | null; // veterinario de la última consulta
}
