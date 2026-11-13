import { BodySystem } from '../enums/body-system.enum';
import { DiagnosisType } from '../enums/diagnosis-type.enum';
import { FindingSeverity } from '../enums/finding-severity.enum';
import { HydrationStatus } from '../enums/hydration-status.enum';
import { AddClinicalFindingCommand } from './add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from './cancel-clinical-consultation.command';
import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';
import { CreateClinicalConsultationCommand } from './create-clinical-consultation.command';
import { ReevaluateDiagnosisCommand } from './reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from './register-anamnesis.command';
import { RegisterDiagnosisCommand } from './register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from './register-physiological-assessment.command';
import { TreatmentStatus } from '../enums/treatment-status.enum';
import { RegisterTreatmentCommand } from './register-treatment.command';

function codeOf(action: () => unknown): ClinicalAttentionErrorCode | null {
  try {
    action();
    return null;
  } catch (error) {
    return error instanceof ClinicalAttentionError ? error.code : null;
  }
}

describe('CreateClinicalConsultationCommand', () => {
  it('trims the reason and keeps the optional consulting room empty', () => {
    const command = new CreateClinicalConsultationCommand(20, 3, null, '  Control general  ');

    expect(command.reason).toBe('Control general');
    expect(command.consultingRoomId).toBeNull();
  });

  it('keeps the consulting room when it is given', () => {
    expect(new CreateClinicalConsultationCommand(20, 3, 7, 'Control').consultingRoomId).toBe(7);
  });

  it.each([
    ['a pet id of zero', () => new CreateClinicalConsultationCommand(0, 3, null, 'Control')],
    ['a decimal clinic id', () => new CreateClinicalConsultationCommand(20, 1.5, null, 'Control')],
    [
      'a negative consulting room',
      () => new CreateClinicalConsultationCommand(20, 3, -1, 'Control'),
    ],
    ['a blank reason', () => new CreateClinicalConsultationCommand(20, 3, null, '   ')],
    [
      'a reason over 350 characters',
      () => new CreateClinicalConsultationCommand(20, 3, null, 'x'.repeat(351)),
    ],
  ])('rejects %s', (_name, action) => {
    expect(codeOf(action)).toBe(ClinicalAttentionErrorCode.InvalidRequest);
  });
});

describe('RegisterAnamnesisCommand', () => {
  it('cleans the text, drops blank or repeated symptoms and turns blank optionals into null', () => {
    const command = new RegisterAnamnesisCommand(10, {
      chiefComplaint: ' Vomita ',
      evolutionTime: ' 2 días ',
      symptoms: ['Vómitos', ' ', 'vómitos', 'Fiebre'],
      diet: '  ',
      ownerObservations: ' Come pasto ',
    });

    expect(command.chiefComplaint).toBe('Vomita');
    expect(command.evolutionTime).toBe('2 días');
    expect(command.symptoms).toEqual(['Vómitos', 'Fiebre']);
    expect(command.diet).toBeNull();
    expect(command.behavior).toBeNull();
    expect(command.ownerObservations).toBe('Come pasto');
  });

  it.each([
    ['no chief complaint', { chiefComplaint: '', evolutionTime: '1 día' }],
    ['no evolution time', { chiefComplaint: 'Vomita', evolutionTime: ' ' }],
    [
      'more than 20 symptoms',
      {
        chiefComplaint: 'Vomita',
        evolutionTime: '1 día',
        symptoms: Array.from({ length: 21 }, (_, index) => `síntoma ${index}`),
      },
    ],
    [
      'a symptom over 100 characters',
      {
        chiefComplaint: 'Vomita',
        evolutionTime: '1 día',
        symptoms: ['x'.repeat(101)],
      },
    ],
    [
      'a diet over 500 characters',
      {
        chiefComplaint: 'Vomita',
        evolutionTime: '1 día',
        diet: 'x'.repeat(501),
      },
    ],
  ])('rejects %s', (_name, input) => {
    expect(codeOf(() => new RegisterAnamnesisCommand(10, input))).toBe(
      ClinicalAttentionErrorCode.InvalidRequest,
    );
  });
});

describe('RegisterPhysiologicalAssessmentCommand', () => {
  const vitals = {
    weightKg: 12.4,
    temperatureCelsius: 38.6,
    heartRateBpm: 90,
    respiratoryRateBpm: 24,
  };

  it('accepts the vital signs and treats the optional data as null', () => {
    const command = new RegisterPhysiologicalAssessmentCommand(10, vitals);

    expect(command.weightKg).toBe(12.4);
    expect(command.bodyConditionScore).toBeNull();
    expect(command.hydrationStatus).toBeNull();
    expect(command.observations).toBeNull();
  });

  it('keeps the optional data when it is given', () => {
    const command = new RegisterPhysiologicalAssessmentCommand(10, {
      ...vitals,
      bodyConditionScore: 5,
      hydrationStatus: HydrationStatus.MildDehydration,
      mucousMembranes: ' Rosadas ',
      capillaryRefillTimeSeconds: 1.5,
      observations: ' Tranquilo ',
    });

    expect(command.bodyConditionScore).toBe(5);
    expect(command.hydrationStatus).toBe(HydrationStatus.MildDehydration);
    expect(command.mucousMembranes).toBe('Rosadas');
    expect(command.capillaryRefillTimeSeconds).toBe(1.5);
    expect(command.observations).toBe('Tranquilo');
  });

  it.each([
    ['weight of zero', { weightKg: 0 }],
    ['weight over 500 kg', { weightKg: 501 }],
    ['temperature under 30', { temperatureCelsius: 29.9 }],
    ['temperature over 45', { temperatureCelsius: 45.1 }],
    ['a decimal heart rate', { heartRateBpm: 90.5 }],
    ['a heart rate over 600', { heartRateBpm: 601 }],
    ['a respiratory rate of zero', { respiratoryRateBpm: 0 }],
    ['a respiratory rate over 300', { respiratoryRateBpm: 301 }],
    ['a body condition score of 10', { bodyConditionScore: 10 }],
    ['a capillary refill of zero', { capillaryRefillTimeSeconds: 0 }],
  ])('rejects %s', (_name, change) => {
    expect(
      codeOf(() => new RegisterPhysiologicalAssessmentCommand(10, { ...vitals, ...change })),
    ).toBe(ClinicalAttentionErrorCode.InvalidVitalSigns);
  });

  it('rejects an unknown hydration status', () => {
    const action = () =>
      new RegisterPhysiologicalAssessmentCommand(10, {
        ...vitals,
        hydrationStatus: 'WET' as HydrationStatus,
      });

    expect(codeOf(action)).toBe(ClinicalAttentionErrorCode.InvalidRequest);
  });
});

describe('AddClinicalFindingCommand', () => {
  it('accepts a finding without severity', () => {
    const command = new AddClinicalFindingCommand(
      10,
      BodySystem.Digestive,
      ' Dolor abdominal ',
      null,
    );

    expect(command.description).toBe('Dolor abdominal');
    expect(command.severity).toBeNull();
  });

  it('keeps the severity', () => {
    expect(
      new AddClinicalFindingCommand(10, BodySystem.Ocular, 'Secreción', FindingSeverity.Mild)
        .severity,
    ).toBe(FindingSeverity.Mild);
  });

  it.each([
    ['no body system', () => new AddClinicalFindingCommand(10, null, 'Dolor', null)],
    [
      'an unknown body system',
      () => new AddClinicalFindingCommand(10, 'BONES' as BodySystem, 'Dolor', null),
    ],
    ['a blank description', () => new AddClinicalFindingCommand(10, BodySystem.Other, ' ', null)],
    [
      'a description over 1000 characters',
      () => new AddClinicalFindingCommand(10, BodySystem.Other, 'x'.repeat(1001), null),
    ],
  ])('rejects %s', (_name, action) => {
    expect(codeOf(action)).toBe(ClinicalAttentionErrorCode.InvalidRequest);
  });
});

describe('RegisterDiagnosisCommand', () => {
  it('cleans the differential diagnoses and keeps the primary flag', () => {
    const command = new RegisterDiagnosisCommand(
      10,
      {
        description: ' Gastroenteritis ',
        type: DiagnosisType.Presumptive,
        differentialDiagnoses: ['Pancreatitis', ' ', 'pancreatitis', 'Parvovirus'],
        rationale: ' ',
      },
      true,
    );

    expect(command.description).toBe('Gastroenteritis');
    expect(command.differentialDiagnoses).toEqual(['Pancreatitis', 'Parvovirus']);
    expect(command.rationale).toBeNull();
    expect(command.primary).toBe(true);
  });

  it.each([
    ['no type', { description: 'Gastroenteritis', type: null }],
    ['a blank description', { description: ' ', type: DiagnosisType.Definitive }],
    [
      'a description over 500 characters',
      { description: 'x'.repeat(501), type: DiagnosisType.Definitive },
    ],
    [
      'more than 10 differentials',
      {
        description: 'Gastroenteritis',
        type: DiagnosisType.Definitive,
        differentialDiagnoses: Array.from({ length: 11 }, (_, index) => `dx ${index}`),
      },
    ],
  ])('rejects %s', (_name, input) => {
    expect(codeOf(() => new RegisterDiagnosisCommand(10, input, false))).toBe(
      ClinicalAttentionErrorCode.InvalidRequest,
    );
  });
});

describe('ReevaluateDiagnosisCommand', () => {
  const input = { description: 'Pancreatitis', type: DiagnosisType.Definitive };

  it('carries the diagnosis being reevaluated', () => {
    const command = new ReevaluateDiagnosisCommand(10, 4, input);

    expect(command.diagnosisId).toBe(4);
    expect(command.type).toBe(DiagnosisType.Definitive);
  });

  it('rejects an invalid diagnosis id', () => {
    expect(codeOf(() => new ReevaluateDiagnosisCommand(10, 0, input))).toBe(
      ClinicalAttentionErrorCode.InvalidRequest,
    );
  });
});

describe('RegisterTreatmentCommand', () => {
  const validTreatmentInput = {
    description: '  Hidratación oral continua  ',
    instruction: '  Dar 5ml cada hora  ',
    startDateTime: new Date('2026-11-13T08:00:00.000Z'),
    endDateTime: new Date('2026-11-18T08:00:00.000Z'),
    treatmentStatus: TreatmentStatus.Active,
  };

  it('trims description and instruction, keeping dates and status intact', () => {
    const command = new RegisterTreatmentCommand(10, validTreatmentInput);

    expect(command.description).toBe('Hidratación oral continua');
    expect(command.instructions).toBe('Dar 5ml cada hora');
    expect(command.startDateTime).toEqual(validTreatmentInput.startDateTime);
    expect(command.endDateTime).toEqual(validTreatmentInput.endDateTime);
  });

  it.each([
    ['a blank description', { ...validTreatmentInput, description: '   ' }],
    ['a null description', { ...validTreatmentInput, description: null }],
    ['a blank instruction', { ...validTreatmentInput, instruction: '' }],
    ['a null instruction', { ...validTreatmentInput, instruction: null }],
    [
      'a description exceeding character limits',
      { ...validTreatmentInput, description: 'x'.repeat(501) }, // Ajusta al límite real de tu CLINICAL_FIELD_LIMITS
    ],
  ])('rejects %s', (_name, input) => {
    expect(codeOf(() => new RegisterTreatmentCommand(10, input as any))).toBe(
      ClinicalAttentionErrorCode.InvalidRequest,
    );
  });
});

describe('CancelClinicalConsultationCommand', () => {
  it('trims the reason', () => {
    expect(new CancelClinicalConsultationCommand(10, ' El tutor se fue ').reason).toBe(
      'El tutor se fue',
    );
  });

  it.each([[''], ['   '], ['x'.repeat(501)]])('rejects the reason "%s"', (reason) => {
    expect(codeOf(() => new CancelClinicalConsultationCommand(10, reason))).toBe(
      ClinicalAttentionErrorCode.InvalidCancellation,
    );
  });
});
