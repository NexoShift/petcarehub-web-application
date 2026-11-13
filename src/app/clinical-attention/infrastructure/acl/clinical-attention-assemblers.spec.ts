import { ConsultationStatus } from '../../domain/enums/consultation-status.enum';
import { DiagnosisStatus } from '../../domain/enums/diagnosis-status.enum';
import { ClinicalAttentionErrorCode } from '../../domain/model/clinical-attention-error';
import { consultationResponse } from '../../testing/clinical-attention.fixtures';
import { toClinicalAttentionError, toClinicalConsultation } from './clinical-attention-assemblers';

describe('toClinicalConsultation', () => {
  it('maps a consultation with all its clinical data', () => {
    const consultation = toClinicalConsultation(
      consultationResponse({
        anamnesis: {
          id: 1,
          chiefComplaint: 'Vomita',
          evolutionTime: '1 día',
          symptoms: ['Vómitos'],
          diet: null,
          behavior: null,
          previousTreatments: null,
          ownerObservations: null,
        },
        physiologicalAssessments: [
          {
            id: 2,
            weightKg: 12.4,
            temperatureCelsius: 38.6,
            heartRateBpm: 90,
            respiratoryRateBpm: 24,
            bodyConditionScore: 5,
            hydrationStatus: 'NORMAL',
            mucousMembranes: null,
            capillaryRefillTimeSeconds: null,
            observations: null,
            recordedAt: '2026-10-30T15:05:00Z',
          },
        ],
        findings: [
          {
            id: 3,
            bodySystem: 'DIGESTIVE',
            description: 'Dolor abdominal',
            severity: 'MODERATE',
            recordedAt: '2026-10-30T15:06:00Z',
          },
        ],
        diagnoses: [
          {
            id: 4,
            description: 'Gastroenteritis',
            type: 'PRESUMPTIVE',
            primary: true,
            differentialDiagnoses: ['Pancreatitis'],
            rationale: 'Vómitos y dolor',
            status: 'CURRENT',
            previousDiagnosisId: null,
            diagnosedByVeterinarianId: 5,
            diagnosedAt: '2026-10-30T15:10:00Z',
          },
        ],
        treatments: [
          {
            id: 1,
            description: 'Tratamiento de soporte para Gastroenteritis aguda',
            instruction: 'Hidratación oral continua en pequeñas tomas y dieta blanda gastrointestinal por 5 días',
            startDateTime: new Date('2026-11-13T08:00:00.000Z'),
            endDateTime: new Date ('2026-11-18T08:00:00.000Z'),
            treatmentStatus: 'ACTIVE',
          },
        ],
      }),
    );

    expect(consultation.status).toBe(ConsultationStatus.InProgress);
    expect(consultation.startedAt).toEqual(new Date('2026-10-30T15:00:00Z'));
    expect(consultation.anamnesis?.symptoms).toEqual(['Vómitos']);
    expect(consultation.physiologicalAssessments[0].recordedAt).toEqual(
      new Date('2026-10-30T15:05:00Z'),
    );
    expect(consultation.findings[0].bodySystem).toBe('DIGESTIVE');
    expect(consultation.diagnoses[0].status).toBe(DiagnosisStatus.Current);

    expect(consultation.primaryDiagnosis?.description).toBe('Gastroenteritis');
  });

  it('treats missing collections as empty', () => {
    const consultation = toClinicalConsultation(
      consultationResponse({
        physiologicalAssessments: null,
        findings: null,
        diagnoses: null,
        anamnesis: null,
      }),
    );

    expect(consultation.physiologicalAssessments).toEqual([]);
    expect(consultation.findings).toEqual([]);
    expect(consultation.diagnoses).toEqual([]);
    expect(consultation.anamnesis).toBeNull();
  });

  it('maps the cancellation of a cancelled consultation', () => {
    const consultation = toClinicalConsultation(
      consultationResponse({
        status: 'CANCELLED',
        cancellationReason: 'El tutor se retiró',
        cancelledAt: '2026-10-30T15:30:00Z',
      }),
    );

    expect(consultation.status).toBe(ConsultationStatus.Cancelled);
    expect(consultation.cancellationReason).toBe('El tutor se retiró');
    expect(consultation.cancelledAt).toEqual(new Date('2026-10-30T15:30:00Z'));
  });
});

describe('toClinicalAttentionError', () => {
  it.each([
    [400, ClinicalAttentionErrorCode.InvalidRequest],
    [401, ClinicalAttentionErrorCode.SessionExpired],
    [403, ClinicalAttentionErrorCode.NotAllowed],
    [404, ClinicalAttentionErrorCode.ConsultationNotFound],
    [409, ClinicalAttentionErrorCode.InvalidConsultationState],
    [500, ClinicalAttentionErrorCode.Unexpected],
    [0, ClinicalAttentionErrorCode.Unexpected],
  ])('maps the status %i', (status, code) => {
    expect(toClinicalAttentionError(status).code).toBe(code);
  });

  it('uses the context of the operation for a 404 and a 409', () => {
    expect(
      toClinicalAttentionError(404, [], { notFound: ClinicalAttentionErrorCode.PetNotFound }).code,
    ).toBe(ClinicalAttentionErrorCode.PetNotFound);
    expect(
      toClinicalAttentionError(409, [], { conflict: ClinicalAttentionErrorCode.DiagnosisConflict })
        .code,
    ).toBe(ClinicalAttentionErrorCode.DiagnosisConflict);
  });

  it('keeps the pending items of an incomplete consultation', () => {
    const error = toClinicalAttentionError(409, ['anamnesis', 'primaryDiagnosis'], {
      conflict: ClinicalAttentionErrorCode.IncompleteConsultation,
    });

    expect(error.code).toBe(ClinicalAttentionErrorCode.IncompleteConsultation);
    expect(error.details).toEqual(['anamnesis', 'primaryDiagnosis']);
  });

  it('reports a plain state conflict when completing answers 409 without pending items', () => {
    const error = toClinicalAttentionError(409, [], {
      conflict: ClinicalAttentionErrorCode.IncompleteConsultation,
    });

    expect(error.code).toBe(ClinicalAttentionErrorCode.InvalidConsultationState);
  });
});
