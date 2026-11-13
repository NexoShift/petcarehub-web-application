import { requireText } from './command-validation';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';


export interface TreatmentInput {
  description: string | null;
  instruction: string | null;
  startDateTime: Date;
  endDateTime: Date;
}

export interface CleanTreatmentInput {
  description: string | null;
  instruction: string | null;
  startDateTime: Date;
  endDateTime: Date;
}

export function cleanTreatmentInput(input: TreatmentInput): CleanTreatmentInput {
  return {
    description: requireText(input.description, CLINICAL_FIELD_LIMITS.treatmentDescription),
    instruction: requireText(input.instruction, CLINICAL_FIELD_LIMITS.treatmentInstruction),
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
  };
}
