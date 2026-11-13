import { BodySystem } from '../../domain/enums/body-system.enum';
import { ConsultationStatus } from '../../domain/enums/consultation-status.enum';
import { DiagnosisStatus } from '../../domain/enums/diagnosis-status.enum';
import { DiagnosisType } from '../../domain/enums/diagnosis-type.enum';
import { FindingSeverity } from '../../domain/enums/finding-severity.enum';
import { HydrationStatus } from '../../domain/enums/hydration-status.enum';
import { Anamnesis } from '../../domain/model/anamnesis.entity';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../../domain/model/clinical-attention-error';
import { ClinicalConsultation } from '../../domain/model/clinical-consultation.entity';
import { ClinicalFinding } from '../../domain/model/clinical-finding.entity';
import { Diagnosis } from '../../domain/model/diagnosis.entity';
import { PhysiologicalAssessment } from '../../domain/model/physiological-assessment.entity';
import {
  AnamnesisResponse,
  ClinicalConsultationResponse,
  ClinicalFindingResponse,
  DiagnosisResponse,
  TreatmentResponse,
  PhysiologicalAssessmentResponse,
} from './clinical-attention-responses';
import { Treatment } from '../../domain/model/treatment.entity';
import { TreatmentStatus } from '../../domain/enums/treatment-status.enum';

const toDate = (value: string | null): Date | null => (value ? new Date(value) : null);

export function toAnamnesis(response: AnamnesisResponse): Anamnesis {
  return new Anamnesis(
    response.id,
    response.chiefComplaint,
    response.evolutionTime,
    response.symptoms ?? [],
    response.diet,
    response.behavior,
    response.previousTreatments,
    response.ownerObservations,
  );
}

export function toPhysiologicalAssessment(
  response: PhysiologicalAssessmentResponse,
): PhysiologicalAssessment {
  return new PhysiologicalAssessment({
    id: response.id,
    weightKg: response.weightKg,
    temperatureCelsius: response.temperatureCelsius,
    heartRateBpm: response.heartRateBpm,
    respiratoryRateBpm: response.respiratoryRateBpm,
    bodyConditionScore: response.bodyConditionScore,
    hydrationStatus: response.hydrationStatus as HydrationStatus | null,
    mucousMembranes: response.mucousMembranes,
    capillaryRefillTimeSeconds: response.capillaryRefillTimeSeconds,
    observations: response.observations,
    recordedAt: new Date(response.recordedAt),
  });
}

export function toClinicalFinding(response: ClinicalFindingResponse): ClinicalFinding {
  return new ClinicalFinding(
    response.id,
    response.bodySystem as BodySystem,
    response.description,
    response.severity as FindingSeverity | null,
    new Date(response.recordedAt),
  );
}

export function toDiagnosis(response: DiagnosisResponse): Diagnosis {
  return new Diagnosis({
    id: response.id,
    description: response.description,
    type: response.type as DiagnosisType,
    primary: response.primary,
    differentialDiagnoses: response.differentialDiagnoses ?? [],
    rationale: response.rationale,
    status: response.status as DiagnosisStatus,
    previousDiagnosisId: response.previousDiagnosisId,
    diagnosedByVeterinarianId: response.diagnosedByVeterinarianId,
    diagnosedAt: new Date(response.diagnosedAt),
  });
}

export function toTreatment(response: TreatmentResponse): Treatment {
  return new Treatment({
    id: response.id,
    description: response.description,
    instruction: response.instruction,
    startDateTime: response.startDateTime,
    endDateTime: response.endDateTime,
    treatmentStatus: response.treatmentStatus as TreatmentStatus,
  });
}

export function toClinicalConsultation(
  response: ClinicalConsultationResponse,
): ClinicalConsultation {
  return new ClinicalConsultation({
    id: response.id,
    petId: response.petId,
    veterinarianId: response.veterinarianId,
    clinicId: response.clinicId,
    consultingRoomId: response.consultingRoomId,
    reason: response.reason,
    status: response.status as ConsultationStatus,
    startedAt: toDate(response.startedAt),
    completedAt: toDate(response.completedAt),
    cancellationReason: response.cancellationReason,
    cancelledAt: toDate(response.cancelledAt),
    anamnesis: response.anamnesis ? toAnamnesis(response.anamnesis) : null,
    physiologicalAssessments: (response.physiologicalAssessments ?? []).map(
      toPhysiologicalAssessment,
    ),
    findings: (response.findings ?? []).map(toClinicalFinding),
    diagnoses: (response.diagnoses ?? []).map(toDiagnosis),
    treatment: (response.treatments ?? []).map(toTreatment),
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
  });
}

/** What a 404 or a 409 means depends on the operation that failed. */
export interface ErrorContext {
  notFound?: ClinicalAttentionErrorCode;
  conflict?: ClinicalAttentionErrorCode;
}

/** Translates an HTTP status into a domain error. `details` are the pending items of a 409. */
export function toClinicalAttentionError(
  status: number,
  details: readonly string[] = [],
  context: ErrorContext = {},
): ClinicalAttentionError {
  switch (status) {
    case 400:
      return new ClinicalAttentionError(ClinicalAttentionErrorCode.InvalidRequest);
    case 401:
      return new ClinicalAttentionError(ClinicalAttentionErrorCode.SessionExpired);
    case 403:
      return new ClinicalAttentionError(ClinicalAttentionErrorCode.NotAllowed);
    case 404:
      return new ClinicalAttentionError(
        context.notFound ?? ClinicalAttentionErrorCode.ConsultationNotFound,
      );
    case 409: {
      // Completing answers 409 with the pending items; without them the state simply changed
      const incomplete =
        context.conflict === ClinicalAttentionErrorCode.IncompleteConsultation &&
        details.length === 0;
      const code = incomplete
        ? ClinicalAttentionErrorCode.InvalidConsultationState
        : (context.conflict ?? ClinicalAttentionErrorCode.InvalidConsultationState);
      return new ClinicalAttentionError(code, details);
    }
    default:
      return new ClinicalAttentionError(ClinicalAttentionErrorCode.Unexpected);
  }
}
