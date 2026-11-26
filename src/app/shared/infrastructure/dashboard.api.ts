import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam';
import { ConsultationStatus } from '../../clinical-attention/domain/enums/consultation-status.enum';
import { ClinicalConsultation } from '../../clinical-attention/domain/model/clinical-consultation.entity';
import { Prescription } from '../../clinical-attention/domain/model/prescription.entity';
import { Treatment } from '../../clinical-attention/domain/model/treatment.entity';
import { CLINICAL_ATTENTION_REPOSITORY } from '../../clinical-attention/infrastructure/repositories/clinical-attention.token';
import { ExamStatus } from '../../clinical-exams/domain/enums/exam-status.enum';
import { ClinicalExam } from '../../clinical-exams/domain/model/clinical-exam.entity';
import { CLINICAL_EXAMS_REPOSITORY } from '../../clinical-exams/infrastructure/repositories/clinical-exams.token';
import { MedicalHistory } from '../../medical-history/domain/model/medical-history.entity';
import { MEDICAL_HISTORY_REPOSITORY } from '../../medical-history/infrastructure/repositories/medical-history.token';
import { Pet } from '../../profiles/domain/model/pet.entity';
import { PetOwner } from '../../profiles/domain/model/pet-owner.entity';
import { ProfileApi } from '../../profiles/infrastructure/profile-api';
import { AiCredit } from '../../subscriptions/domain/model/ai-credit.entity';
import { SubscriptionApi } from '../../subscriptions/infrastructure/subscription-api';
import {
  ActiveTreatment,
  AiQuota,
  AssignedVet,
  ClinicalAlert,
  OwnerDashboard,
  PetSummary,
  PetTag,
  ReadyResult,
  UpcomingEvent,
} from '../domain/model/dashboard/owner-dashboard';
import {
  Kpi,
  PendingExam,
  RecentConsultation,
  TodayPatient,
  VetDashboard,
} from '../domain/model/dashboard/vet-dashboard';
import { daysBetween, todayIso } from '../domain/services/progress';

/**
 * Arma los paneles de inicio con datos reales:
 * Profiles (clínica, pacientes, dueños, mascotas), Clinical Attention (consultas y tratamientos),
 * Clinical Exams (exámenes), Medical History (alergias y vacunas) y Subscriptions (créditos de IA).
 * Si una llamada falla, esa parte queda vacía y el resto se muestra.
 */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);
  private readonly consultations = inject(CLINICAL_ATTENTION_REPOSITORY);
  private readonly exams = inject(CLINICAL_EXAMS_REPOSITORY);
  private readonly histories = inject(MEDICAL_HISTORY_REPOSITORY);
  private readonly subscriptions = inject(SubscriptionApi);

  // =================================================================
  // Panel del veterinario
  // =================================================================
  async getVetDashboard(): Promise<VetDashboard> {
    const user = this.iam.currentUser();
    if (!user) throw new Error('No session');

    // El admin y los vets de la clínica comparten la cuenta (accountId)
    const clinic = await firstValueFrom(this.profiles.getClinicByAccountId(user.accountId));
    const vetLastName = await firstValueFrom(this.profiles.getVeterinarianByUserId(user.id))
      .then((vet) => vet.lastName)
      .catch(() => user.email.split('@')[0]);

    const [pets, clinicExams] = await Promise.all([
      safe(firstValueFrom(this.profiles.getPatientsByClinicId(clinic.id)), [] as Pet[]),
      safe(this.exams.findOfMyClinic(null), [] as ClinicalExam[]),
    ]);
    const owners = await this.ownersOf(pets);

    // Consultas de cada paciente, solo las de esta clínica
    const perPet = await Promise.all(
      pets.map((pet) => safe(this.consultations.findByPetId(pet.id), [] as ClinicalConsultation[])),
    );
    const consultations = perPet.flat().filter((c) => c.clinicId === clinic.id);
    const petName = new Map(pets.map((pet) => [pet.id, pet.name]));

    const waiting = consultations.filter((c) => c.status === ConsultationStatus.Created);
    const ongoing = consultations.filter((c) => c.status === ConsultationStatus.InProgress);
    const completed = consultations
      .filter((c) => c.status === ConsultationStatus.Completed && c.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
    const completedToday = completed.filter((c) => isToday(c.completedAt!));
    const completedWeek = completed.filter((c) => daysAgo(c.completedAt!) < 7);

    const pending = clinicExams.filter(
      (e) => e.status === ExamStatus.Requested || e.status === ExamStatus.InProcess,
    );
    const toValidate = pending.filter((e) => e.result !== null && !e.result.validated);

    const kpis: Kpi[] = [
      {
        label: 'dashboard.vet.kpi.attended',
        value: completedToday.length,
        unit: unitOf(completedToday.length),
        hint: 'dashboard.vet.kpi.thisWeek',
        hintParams: { count: completedWeek.length },
        icon: 'users',
      },
      {
        label: 'dashboard.vet.kpi.waiting',
        value: waiting.length,
        unit: unitOf(waiting.length),
        hint: 'dashboard.vet.kpi.toStart',
        icon: 'clock',
        highlight: waiting.length > 0,
      },
      {
        label: 'dashboard.vet.kpi.ongoing',
        value: ongoing.length,
        unit: unitOf(ongoing.length),
        hint: 'dashboard.vet.kpi.inCare',
        icon: 'stethoscope',
      },
      {
        label: 'dashboard.vet.kpi.pendingExams',
        value: pending.length,
        unit: pending.length === 1 ? 'dashboard.vet.kpi.order' : 'dashboard.vet.kpi.orders',
        hint: 'dashboard.vet.kpi.toValidate',
        hintParams: { count: toValidate.length },
        icon: 'flask',
      },
    ];

    const patients = pets
      .map((pet) =>
        toTodayPatient(
          pet,
          owners.get(pet.ownerId) ?? null,
          consultations.filter((c) => c.petId === pet.id),
        ),
      )
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

    const exams: PendingExam[] = pending
      .sort((a, b) => Number(b.result !== null) - Number(a.result !== null))
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        type: e.type,
        patient: petName.get(e.petId) ?? `#${e.petId}`,
        consultationId: e.consultationId,
        status: e.status,
        needsValidation: e.result !== null && !e.result.validated,
      }));

    const recent: RecentConsultation[] = completed.slice(0, 5).map((c) => ({
      id: c.id,
      patient: petName.get(c.petId) ?? `#${c.petId}`,
      reason: c.reason,
      date: c.completedAt!,
    }));

    const firstOngoing = ongoing[0];
    return {
      vetLastName,
      clinic: clinic.name,
      patientCount: pets.length,
      waitingNow: waiting.length,
      syncedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      kpis,
      patients,
      exams,
      recent,
      ongoing: firstOngoing
        ? {
            id: firstOngoing.id,
            petId: firstOngoing.petId,
            patient: petName.get(firstOngoing.petId) ?? `#${firstOngoing.petId}`,
          }
        : null,
    };
  }

  private async ownersOf(pets: Pet[]): Promise<Map<number, PetOwner>> {
    const ids = [...new Set(pets.map((pet) => pet.ownerId))];
    const owners = await Promise.all(
      ids.map((id) =>
        safe(firstValueFrom(this.profiles.getPetOwnerById(id)), null as PetOwner | null),
      ),
    );
    return new Map(owners.filter((o): o is PetOwner => o !== null).map((o) => [o.id, o]));
  }

  // =================================================================
  // Panel del dueño
  // =================================================================
  async getOwnerDashboard(): Promise<OwnerDashboard> {
    const user = this.iam.currentUser();
    if (!user) throw new Error('No session');

    const quota = this.aiQuotaOf(user.accountId);
    const owner = await firstValueFrom(this.profiles.getPetOwnerByUserId(user.id));
    const pets = await safe(firstValueFrom(this.profiles.getPetsByOwnerId(owner.id)), [] as Pet[]);

    const data = await Promise.all(
      pets.map(async (pet) => ({
        pet,
        consultations: await safe(
          this.consultations.findByPetId(pet.id),
          [] as ClinicalConsultation[],
        ),
        exams: await safe(this.exams.findByPetId(pet.id), [] as ClinicalExam[]),
      })),
    );

    const events: UpcomingEvent[] = [];
    const results: ReadyResult[] = [];
    for (const { pet, consultations, exams } of data) {
      for (const c of consultations) {
        if (c.status === ConsultationStatus.Created || c.status === ConsultationStatus.InProgress) {
          events.push({
            kind: 'consultation',
            date: c.startedAt ?? c.createdAt,
            title:
              c.status === ConsultationStatus.Created
                ? 'dashboard.owner.events.consultationScheduled'
                : 'dashboard.owner.events.consultationOngoing',
            detail: c.reason,
            pet: pet.name,
            badge: `clinicalAttention.status.${c.status}`,
            link: ['/my-consultations', c.id],
          });
        }
      }
      for (const e of exams) {
        if (e.status === ExamStatus.Requested || e.status === ExamStatus.InProcess) {
          events.push({
            kind: 'exam',
            date: e.startedAt ?? e.requestedAt,
            title: 'dashboard.owner.events.examPending',
            examType: e.type,
            detail: e.indication ?? '',
            pet: pet.name,
            badge: `clinicalExams.status.${e.status}`,
            link: ['/exams'],
            query: { petId: pet.id },
          });
        }
        if (e.result?.validated) {
          results.push({
            examId: e.id,
            petId: pet.id,
            pet: pet.name,
            type: e.type,
            summary: e.result.summary,
            date: e.result.resultDate,
          });
        }
      }
    }
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    results.sort((a, b) => b.date.localeCompare(a.date));

    // Veterinario de la última consulta de cualquiera de sus mascotas
    const last = data
      .flatMap((d) => d.consultations)
      .filter((c) => c.status !== ConsultationStatus.Cancelled)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const today = todayIso();
    const [treatment, histories] = await Promise.all([
      this.activeTreatmentOf(data, today),
      Promise.all(
        pets.map(async (pet) => ({ pet, history: await safe(this.histories.findByPetId(pet.id), null) })),
      ),
    ]);

    return {
      ownerFirstName: owner.firstName,
      pets: data.map(({ pet, consultations, exams }) => toPetSummary(pet, consultations, exams)),
      alert: pickClinicalAlert(histories, today),
      treatment,
      events: events.slice(0, 4),
      results: results.slice(0, 3),
      aiQuota: await quota,
      assignedVet: last ? await this.vetOf(last) : null,
    };
  }

  /** Plan y créditos de IA del periodo; null si no hay suscripción activa (404/403). */
  private async aiQuotaOf(accountId: number): Promise<AiQuota | null> {
    try {
      const [subscription, credits] = await Promise.all([
        firstValueFrom(this.subscriptions.getSubscriptionByAccountId(accountId)),
        firstValueFrom(this.subscriptions.getAiCredits(accountId)),
      ]);
      const plan = await safe(firstValueFrom(this.subscriptions.getPlanById(subscription.planId)), null);
      return toAiQuota(plan?.name ?? '', credits, new Date());
    } catch {
      return null;
    }
  }

  /** Completa el tratamiento vigente con el nombre del vet que lo indicó y de la clínica. */
  private async activeTreatmentOf(
    data: { pet: Pet; consultations: ClinicalConsultation[] }[],
    today: string,
  ): Promise<ActiveTreatment | null> {
    const picked = pickActiveTreatment(data, today);
    if (!picked) return null;
    const { pet, consultation, treatment, prescription, others } = picked;
    const [vet, clinic] = await Promise.all([
      safe(firstValueFrom(this.profiles.getVeterinarianById(treatment.prescribedByVeterinarianId)), null),
      safe(firstValueFrom(this.profiles.getClinicById(consultation.clinicId)), null),
    ]);
    return toActiveTreatment(pet, consultation, treatment, prescription, today, {
      vet: vet ? `${vet.firstName} ${vet.lastName}` : '',
      clinic: clinic?.name ?? '',
      others,
    });
  }

  private async vetOf(consultation: ClinicalConsultation): Promise<AssignedVet | null> {
    const [vet, clinic] = await Promise.all([
      safe(firstValueFrom(this.profiles.getVeterinarianById(consultation.veterinarianId)), null),
      safe(firstValueFrom(this.profiles.getClinicById(consultation.clinicId)), null),
    ]);
    if (!vet) return null;
    return {
      name: `${vet.firstName} ${vet.lastName}`,
      license: vet.licenseNumber ?? '',
      clinic: clinic?.name ?? '',
      phone: clinic?.phoneNumber ?? null,
      address: clinic?.address ?? null,
    };
  }
}

// =================================================================
// Funciones de apoyo
// =================================================================

/** Alerta prioritaria: vacunas vencidas primero (la más antigua), luego alergias severas. */
export function pickClinicalAlert(
  histories: { pet: Pet; history: MedicalHistory | null }[],
  today: string,
): ClinicalAlert | null {
  const alerts: ClinicalAlert[] = [];
  const overdue = histories
    .flatMap(({ pet, history }) =>
      (history?.vaccinations ?? []).filter((v) => v.isOverdueOn(today)).map((v) => ({ pet, v })),
    )
    .sort((a, b) => (a.v.nextDoseOn ?? '').localeCompare(b.v.nextDoseOn ?? ''));
  for (const { pet, v } of overdue) {
    alerts.push({ kind: 'vaccine', petId: pet.id, pet: pet.name, subject: v.vaccineName, detail: null, dueOn: v.nextDoseOn, others: 0 });
  }
  for (const { pet, history } of histories) {
    for (const a of history?.allergies.filter((x) => x.isSevere) ?? []) {
      alerts.push({ kind: 'allergy', petId: pet.id, pet: pet.name, subject: a.allergen, detail: a.reaction, dueOn: null, others: 0 });
    }
  }
  return alerts.length ? { ...alerts[0], others: alerts.length - 1 } : null;
}

/** Lo que hace falta para mostrar un tratamiento vigente. */
export interface PickedTreatment {
  pet: Pet;
  consultation: ClinicalConsultation;
  treatment: Treatment;
  prescription: Prescription | null;
  others: number;
}

/**
 * Elige el tratamiento vigente hoy que empezó más recientemente entre todas las mascotas.
 * Junto a él va la última receta de la misma consulta (sus medicamentos).
 */
export function pickActiveTreatment(
  data: { pet: Pet; consultations: ClinicalConsultation[] }[],
  today: string,
): PickedTreatment | null {
  const current = data.flatMap(({ pet, consultations }) =>
    consultations.flatMap((consultation) =>
      consultation.treatments
        .filter((treatment) => treatment.isCurrentOn(today))
        .map((treatment) => ({ pet, consultation, treatment })),
    ),
  );
  if (current.length === 0) return null;
  current.sort((a, b) => b.treatment.startDate.localeCompare(a.treatment.startDate));
  const { pet, consultation, treatment } = current[0];
  const prescription =
    [...consultation.prescriptions].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())[0] ?? null;
  return { pet, consultation, treatment, prescription, others: current.length - 1 };
}

/** Pasa el tratamiento elegido al modelo de la tarjeta del panel. */
export function toActiveTreatment(
  pet: Pet,
  consultation: ClinicalConsultation,
  treatment: Treatment,
  prescription: Prescription | null,
  today: string,
  names: { vet: string; clinic: string; others: number },
): ActiveTreatment {
  const totalDays = treatment.endDate ? daysBetween(treatment.startDate, treatment.endDate) + 1 : null;
  const elapsed = daysBetween(treatment.startDate, today) + 1;
  return {
    petId: pet.id,
    pet: pet.name,
    consultationId: consultation.id,
    title: treatment.description,
    instruction: treatment.instruction,
    startDate: treatment.startDate,
    endDate: treatment.endDate,
    currentDay: totalDays ? Math.min(elapsed, totalDays) : elapsed,
    totalDays,
    prescribedBy: names.vet,
    clinic: names.clinic,
    generalInstruction: prescription?.generalInstruction ?? null,
    medications: (prescription?.medications ?? []).map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
    })),
    otherActive: names.others,
  };
}

/** "1 consulta" o "2 consultas". */
function unitOf(count: number): string {
  return count === 1 ? 'dashboard.vet.kpi.consultation' : 'dashboard.vet.kpi.consultations';
}

/** Si la llamada falla, devuelve el valor por defecto para que el panel se muestre igual. */
/** Créditos del backend → cuota del panel. LLM primero: es lo que más usa el dueño. */
export function toAiQuota(plan: string, credits: AiCredit, now: Date): AiQuota {
  const usage = (kind: 'llm' | 'vision') => {
    const balance = kind === 'llm' ? credits.llm : credits.computerVision;
    const used = Math.min(balance.limit, balance.consumed + balance.reserved);
    return {
      kind,
      label: `dashboard.owner.usage.${kind}`,
      hint: `dashboard.owner.usage.${kind}Hint`,
      used,
      limit: balance.limit,
      left: Math.max(0, balance.available),
    };
  };
  const end = new Date(credits.periodEnd);
  return {
    plan,
    periodStart: credits.periodStart.slice(0, 10),
    periodEnd: credits.periodEnd.slice(0, 10),
    renewsInDays: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000)),
    usages: [usage('llm'), usage('vision')],
    loadedAt: now,
  };
}

function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

const STATUS_ORDER: Record<TodayPatient['status'], number> = {
  'in-progress': 0,
  waiting: 1,
  ok: 2,
};

const SPECIES_LABEL: Record<Pet['species'], TodayPatient['species']> = {
  DOG: 'Canino',
  CAT: 'Felino',
  OTHER: 'Otro',
};

function toTodayPatient(
  pet: Pet,
  owner: PetOwner | null,
  consultations: ClinicalConsultation[],
): TodayPatient {
  const byDate = [...consultations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const ongoing = byDate.find((c) => c.status === ConsultationStatus.InProgress);
  const waiting = byDate.find((c) => c.status === ConsultationStatus.Created);
  const lastDone = byDate.find((c) => c.status === ConsultationStatus.Completed);

  const base = {
    petId: pet.id,
    code: `#${pet.petCode}`,
    name: pet.name,
    species: SPECIES_LABEL[pet.species],
    breed: pet.breed ?? '',
    ageYears: ageInYears(pet.birthDate),
    weightKg: byDate.find((c) => c.latestAssessment)?.latestAssessment?.weightKg,
    photoUrl: pet.profileImageUrl ?? undefined,
    ownerName: owner ? `${owner.firstName} ${owner.lastName}` : '—',
    ownerPhone: owner?.phoneNumber ?? '',
  };

  if (ongoing) {
    return {
      ...base,
      status: 'in-progress',
      statusText: 'dashboard.vet.patientStatus.inProgress',
      statusParams: { id: ongoing.id },
      noteTitle: 'dashboard.vet.note.reason',
      noteDate: ongoing.startedAt ?? ongoing.createdAt,
      note: ongoing.reason,
      primaryAction: 'dashboard.vet.actions.continue',
      primaryLink: ['/consultations', ongoing.id],
    };
  }
  if (waiting) {
    return {
      ...base,
      status: 'waiting',
      statusText: 'dashboard.vet.patientStatus.waiting',
      statusParams: { id: waiting.id },
      noteTitle: 'dashboard.vet.note.reason',
      noteDate: waiting.createdAt,
      note: waiting.reason,
      primaryAction: 'dashboard.vet.actions.start',
      primaryLink: ['/consultations', waiting.id],
    };
  }
  return {
    ...base,
    status: 'ok',
    statusText: lastDone
      ? 'dashboard.vet.patientStatus.lastVisit'
      : 'dashboard.vet.patientStatus.noVisits',
    statusParams: { count: consultations.length },
    noteTitle: 'dashboard.vet.note.lastVisit',
    noteDate: lastDone?.completedAt ?? undefined,
    note: lastDone ? (lastDone.primaryDiagnosis?.description ?? lastDone.reason) : '',
    primaryAction: 'dashboard.vet.actions.newConsultation',
    primaryLink: ['/consultations/new'],
    primaryQuery: { petId: pet.id },
  };
}

function toPetSummary(
  pet: Pet,
  consultations: ClinicalConsultation[],
  exams: ClinicalExam[],
): PetSummary {
  const ongoing = consultations.some((c) => c.status === ConsultationStatus.InProgress);
  const completed = consultations
    .filter((c) => c.status === ConsultationStatus.Completed)
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  const weight = completed.find((c) => c.latestAssessment)?.latestAssessment?.weightKg;
  const pendingExams = exams.filter(
    (e) => e.status === ExamStatus.Requested || e.status === ExamStatus.InProcess,
  ).length;
  const readyResults = exams.filter((e) => e.result?.validated).length;

  const tags: PetTag[] = [];
  if (readyResults > 0)
    tags.push({
      label: 'dashboard.owner.tags.results',
      params: { count: readyResults },
      tone: 'success',
    });
  if (pendingExams > 0)
    tags.push({
      label: 'dashboard.owner.tags.pendingExams',
      params: { count: pendingExams },
      tone: 'neutral',
    });
  if (completed.length > 0) {
    tags.push({
      label: 'dashboard.owner.tags.visits',
      params: { count: completed.length },
      tone: 'neutral',
    });
  } else if (!ongoing) {
    tags.push({ label: 'dashboard.owner.tags.noVisits', tone: 'neutral' });
  }

  return {
    id: pet.id,
    name: pet.name,
    species: `enums.species.${pet.species}`,
    breed: pet.breed ?? '',
    ageYears: ageInYears(pet.birthDate),
    weightKg: weight ?? undefined,
    photoUrl: pet.profileImageUrl ?? undefined,
    active: ongoing,
    verified: completed.length > 0,
    tags,
  };
}

function ageInYears(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  if (
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
  )
    years--;
  return Math.max(years, 0);
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function daysAgo(date: Date): number {
  return (Date.now() - date.getTime()) / 86_400_000;
}
