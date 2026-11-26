import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { requireId, requireText } from './command-validation';

export interface TreatmentInput {
  description: string;
  instruction: string;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" o vacío si no tiene fecha de fin. */
  endDate?: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Registra un tratamiento. La consulta tiene que estar en curso y la fecha de fin no puede ser anterior a la de inicio. */
export class RegisterTreatmentCommand {
  readonly description: string;
  readonly instruction: string;
  readonly startDate: string;
  readonly endDate: string | null;

  constructor(
    readonly consultationId: number,
    input: TreatmentInput,
  ) {
    requireId(consultationId);
    this.description = requireText(input.description, CLINICAL_FIELD_LIMITS.treatmentDescription);
    this.instruction = requireText(input.instruction, CLINICAL_FIELD_LIMITS.treatmentInstruction);
    const start = input.startDate?.trim() ?? '';
    const end = input.endDate?.trim() || null;
    if (!ISO_DATE.test(start) || (end !== null && (!ISO_DATE.test(end) || end < start))) {
      throw new ClinicalAttentionError(ClinicalAttentionErrorCode.InvalidTreatmentDates);
    }
    this.startDate = start;
    this.endDate = end;
  }
}
