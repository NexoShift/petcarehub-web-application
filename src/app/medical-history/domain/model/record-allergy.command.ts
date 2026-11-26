import { AllergySeverity } from '../enums/allergy-severity.enum';
import { MedicalHistoryError, MedicalHistoryErrorCode } from './medical-history-error';
import { MEDICAL_HISTORY_FIELD_LIMITS as LIMITS } from './medical-history-field-limits';

export interface AllergyInput {
  allergen: string;
  reaction: string;
  severity: AllergySeverity | null;
  notes: string;
}

/** Records an allergy (owner or veterinarian). Validates like the backend. */
export class RecordAllergyCommand {
  readonly allergen: string;
  readonly reaction: string | null;
  readonly severity: AllergySeverity;
  readonly notes: string | null;

  constructor(readonly petId: number, input: AllergyInput) {
    const allergen = input.allergen.trim();
    const reaction = input.reaction.trim();
    const notes = input.notes.trim();
    if (
      !Number.isInteger(petId) || petId <= 0 ||
      !allergen || allergen.length > LIMITS.allergen ||
      reaction.length > LIMITS.reaction ||
      notes.length > LIMITS.allergyNotes ||
      !input.severity || !Object.values(AllergySeverity).includes(input.severity)
    ) {
      throw new MedicalHistoryError(MedicalHistoryErrorCode.InvalidAllergy);
    }
    this.allergen = allergen;
    this.reaction = reaction || null;
    this.severity = input.severity;
    this.notes = notes || null;
  }
}
