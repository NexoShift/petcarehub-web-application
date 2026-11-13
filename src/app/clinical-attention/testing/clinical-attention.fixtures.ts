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
import { Treatment, TreatmentProps } from '../domain/model/treatment.entity';
import { TreatmentStatus } from '../domain/enums/treatment-status.enum';

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

export function treatment(overrides?: Partial<TreatmentProps>): Treatment {
  return new Treatment({
    id: 1,
    description: 'Tratamiento de soporte para Gastroenteritis aguda',
    instruction:
      'Hidratación oral continua en pequeñas tomas y dieta blanda gastrointestinal por 5 días',
    startDateTime: new Date('2026-11-13T09:00:00'),
    endDateTime: new Date('2026-11-18T09:00:00'),
    treatmentStatus: TreatmentStatus.Active,
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
    treatment: [],
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
    treatments: [],
    createdAt: '2026-10-30T15:00:00Z',
    updatedAt: '2026-10-30T15:00:00Z',
    ...overrides,
  };
}
