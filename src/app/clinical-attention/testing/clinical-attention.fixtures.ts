import { ConsultationStatus } from '../domain/enums/consultation-status.enum';
import { DiagnosisStatus } from '../domain/enums/diagnosis-status.enum';
import { DiagnosisType } from '../domain/enums/diagnosis-type.enum';
import { Anamnesis } from '../domain/model/anamnesis.entity';
import {
  ClinicalConsultation,
  ClinicalConsultationProps,
} from '../domain/model/clinical-consultation.entity';
import { Diagnosis, DiagnosisProps } from '../domain/model/diagnosis.entity';
import { PhysiologicalAssessment } from '../domain/model/physiological-assessment.entity';
import { ClinicalConsultationResponse } from '../infrastructure/acl/clinical-attention-responses';

const NOW = new Date('2026-10-30T15:00:00Z');

export function anamnesis(): Anamnesis {
  return new Anamnesis(
    1,
    'Vomita desde ayer',
    'Menos de 24 horas',
    ['Vómitos'],
    null,
    null,
    null,
    null,
  );
}

export function assessment(id = 1): PhysiologicalAssessment {
  return new PhysiologicalAssessment({
    id,
    weightKg: 12.4,
    temperatureCelsius: 38.6,
    heartRateBpm: 90,
    respiratoryRateBpm: 24,
    bodyConditionScore: null,
    hydrationStatus: null,
    mucousMembranes: null,
    capillaryRefillTimeSeconds: null,
    observations: null,
    recordedAt: NOW,
  });
}

export function diagnosis(overrides: Partial<DiagnosisProps> = {}): Diagnosis {
  return new Diagnosis({
    id: 1,
    description: 'Gastroenteritis aguda',
    type: DiagnosisType.Presumptive,
    primary: true,
    differentialDiagnoses: [],
    rationale: null,
    status: DiagnosisStatus.Current,
    previousDiagnosisId: null,
    diagnosedByVeterinarianId: 5,
    diagnosedAt: NOW,
    ...overrides,
  });
}

export function consultation(
  overrides: Partial<ClinicalConsultationProps> = {},
): ClinicalConsultation {
  return new ClinicalConsultation({
    id: 10,
    petId: 20,
    veterinarianId: 5,
    clinicId: 3,
    consultingRoomId: null,
    reason: 'Control general',
    status: ConsultationStatus.InProgress,
    startedAt: NOW,
    completedAt: null,
    cancellationReason: null,
    cancelledAt: null,
    anamnesis: null,
    physiologicalAssessments: [],
    findings: [],
    diagnoses: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });
}

/** A consultation in progress with everything needed to complete it. */
export function completableConsultation(): ClinicalConsultation {
  return consultation({
    anamnesis: anamnesis(),
    physiologicalAssessments: [assessment()],
    diagnoses: [diagnosis()],
  });
}

export function consultationResponse(
  overrides: Partial<ClinicalConsultationResponse> = {},
): ClinicalConsultationResponse {
  return {
    id: 10,
    petId: 20,
    veterinarianId: 5,
    clinicId: 3,
    consultingRoomId: null,
    reason: 'Control general',
    status: 'IN_PROGRESS',
    startedAt: '2026-10-30T15:00:00Z',
    completedAt: null,
    cancellationReason: null,
    cancelledAt: null,
    anamnesis: null,
    physiologicalAssessments: [],
    findings: [],
    diagnoses: [],
    createdAt: '2026-10-30T15:00:00Z',
    updatedAt: '2026-10-30T15:00:00Z',
    ...overrides,
  };
}
