/*
 * Modelo de lectura del panel del dueño de mascota.
 * Vive en shared porque no es un bounded context: junta datos que ya existen en otros contextos
 * (Profiles: mascotas; Clinical Attention: consultas; Clinical Exams: exámenes y resultados).
 * Lo que no aplica (sin tratamiento vigente, sin alertas, sin plan) llega en null y esa
 * tarjeta no se muestra.
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

/** Un medicamento de la última receta de la consulta (Clinical Attention). */
export interface TreatmentMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

/**
 * Tratamiento vigente hoy de una de las mascotas (el que empezó más recientemente).
 * Sale de las consultas: indicación del vet + medicamentos de la receta de esa consulta.
 */
export interface ActiveTreatment {
  petId: number;
  pet: string;
  consultationId: number;
  title: string;
  instruction: string;
  startDate: string; // yyyy-MM-dd
  endDate: string | null; // null = sin fecha de fin
  currentDay: number; // día del tratamiento, desde 1
  totalDays: number | null; // null si no tiene fecha de fin
  prescribedBy: string;
  clinic: string;
  generalInstruction: string | null;
  medications: TreatmentMedication[];
  otherActive: number; // otros tratamientos vigentes de sus mascotas
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

/** Créditos de IA de un tipo en el periodo actual (Subscriptions: /subscription/ai-credits). */
export interface AiUsage {
  kind: 'llm' | 'vision';
  /** Claves de i18n. */
  label: string;
  hint: string;
  /** Consumidos + reservados (los reservados son pedidos en curso). */
  used: number;
  limit: number;
  left: number;
}

export interface AiQuota {
  plan: string;
  /** Inicio y fin del periodo (yyyy-MM-dd). */
  periodStart: string;
  periodEnd: string;
  renewsInDays: number;
  usages: AiUsage[];
  /** Cuándo se leyeron los créditos: lo hecho después se suma en pantalla. */
  loadedAt: Date;
}

/** Veterinario de la última consulta y datos de contacto de su clínica (Profiles). */
export interface AssignedVet {
  name: string;
  license: string;
  clinic: string;
  phone: string | null;
  address: string | null;
}

export interface OwnerDashboard {
  ownerFirstName: string;
  pets: PetSummary[];
  alert: ClinicalAlert | null; // null si no hay nada urgente
  treatment: ActiveTreatment | null; // null si ninguna mascota tiene un tratamiento vigente
  events: UpcomingEvent[];
  results: ReadyResult[];
  aiQuota: AiQuota | null; // null si la cuenta no tiene suscripción activa
  assignedVet: AssignedVet | null; // veterinario de la última consulta
}
