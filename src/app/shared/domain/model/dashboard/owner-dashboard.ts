/*
 * Modelo de lectura del panel del dueño de mascota.
 * Vive en shared porque no es un bounded context: junta datos que ya existen en otros contextos
 * (Profiles: mascotas, Clinical Attention: tratamientos, Subscriptions: cuota IA, etc.).
 * Por eso aquí solo hay interfaces de datos y alguna función de cálculo pura.
 */

/** Etiqueta de estado de una mascota (vacunas, alergias, plan sanitario). */
export interface PetTag {
  label: string;
  tone: 'success' | 'danger' | 'neutral';
}

export interface PetSummary {
  id: number;
  name: string;
  species: string;            // "Canino", "Felino"
  breed: string;
  ageYears: number;
  weightKg: number;
  photoUrl?: string;          // opcional: si no hay foto se muestra la inicial
  active: boolean;
  verified: boolean;          // historia validada por un veterinario
  tags: PetTag[];
}

export interface ClinicalAlert {
  title: string;              // "Alergia confirmada a Penicilina y betalactámicos"
  detail: string;             // quién lo registró
  badge: string;              // "CONTRAINDICADO"
}

export interface Medication {
  name: string;
  posology: string;           // "1 tableta cada 12 horas con alimento"
  note: string;
  dosesPerDay: number;
}

export interface ActiveTreatment {
  prescriptionCode: string;   // "#R-2026-89"
  route: string;              // "Terapia oral"
  title: string;
  prescribedBy: string;
  startedAt: string;          // "12 Sep 2026"
  totalDays: number;
  currentDay: number;
  dosesTaken: number;
  medication: Medication;
  nextDose: string;           // "Hoy, 08:00 PM"
}

export interface UpcomingEvent {
  day: string;                // "19"
  month: string;              // "SEP"
  title: string;
  detail: string;
  meta: string;               // hora y sede
  badge?: string;             // "En 5 días"
}

export interface AiUsage {
  label: string;
  used: number;
  limit: number;
  hint: string;
}

export interface AiQuota {
  plan: string;               // "Plan Premium"
  cycle: string;              // "15 Sep – 15 Oct"
  renewsInDays: number;
  usages: AiUsage[];
}

export interface AssignedVet {
  name: string;
  role: string;
  clinic: string;
}

export interface OwnerDashboard {
  ownerFirstName: string;
  verifiedBy: string;         // "CMVP N° 8492 · Dr. Valdivia"
  pets: PetSummary[];
  alert: ClinicalAlert | null;
  treatment: ActiveTreatment | null;
  events: UpcomingEvent[];
  aiQuota: AiQuota;
  assignedVet: AssignedVet;
}
