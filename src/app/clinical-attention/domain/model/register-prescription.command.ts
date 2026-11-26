import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { optionalText, requireId, requireText } from './command-validation';

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  indication?: string | null;
}

export interface PrescriptionInput {
  generalInstruction?: string | null;
  medications: readonly MedicationInput[];
}

/** Emite una receta con 1 a 15 medicamentos (las filas totalmente vacías se ignoran). */
export class RegisterPrescriptionCommand {
  readonly generalInstruction: string | null;
  readonly medications: Required<MedicationInput>[];

  constructor(
    readonly consultationId: number,
    input: PrescriptionInput,
  ) {
    requireId(consultationId);
    this.generalInstruction = optionalText(input.generalInstruction, CLINICAL_FIELD_LIMITS.prescriptionInstruction);
    const rows = input.medications.filter((m) =>
      [m.name, m.dosage, m.frequency, m.duration, m.indication ?? ''].some((v) => v.trim() !== ''),
    );
    if (rows.length === 0 || rows.length > CLINICAL_FIELD_LIMITS.maxMedications) {
      throw new ClinicalAttentionError(ClinicalAttentionErrorCode.InvalidPrescription);
    }
    const limits = CLINICAL_FIELD_LIMITS;
    this.medications = rows.map((m) => ({
      name: requireText(m.name, limits.medicationName),
      dosage: requireText(m.dosage, limits.medicationDosage),
      frequency: requireText(m.frequency, limits.medicationFrequency),
      duration: requireText(m.duration, limits.medicationDuration),
      indication: optionalText(m.indication, limits.medicationIndication),
    }));
  }
}
