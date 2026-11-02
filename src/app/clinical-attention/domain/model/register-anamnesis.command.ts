import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { cleanList, optionalText, requireId, requireText } from './command-validation';

export interface AnamnesisInput {
  chiefComplaint: string;
  evolutionTime: string;
  symptoms?: readonly string[] | null;
  diet?: string | null;
  behavior?: string | null;
  previousTreatments?: string | null;
  ownerObservations?: string | null;
}

/** The anamnesis is registered once per consultation and is never overwritten (CON-01). */
export class RegisterAnamnesisCommand {
  readonly chiefComplaint: string;
  readonly evolutionTime: string;
  readonly symptoms: string[];
  readonly diet: string | null;
  readonly behavior: string | null;
  readonly previousTreatments: string | null;
  readonly ownerObservations: string | null;

  constructor(
    readonly consultationId: number,
    input: AnamnesisInput,
  ) {
    requireId(consultationId);
    this.chiefComplaint = requireText(input.chiefComplaint, CLINICAL_FIELD_LIMITS.chiefComplaint);
    this.evolutionTime = requireText(input.evolutionTime, CLINICAL_FIELD_LIMITS.evolutionTime);
    this.symptoms = cleanList(
      input.symptoms,
      CLINICAL_FIELD_LIMITS.maxSymptoms,
      CLINICAL_FIELD_LIMITS.symptom,
    );
    this.diet = optionalText(input.diet, CLINICAL_FIELD_LIMITS.diet);
    this.behavior = optionalText(input.behavior, CLINICAL_FIELD_LIMITS.behavior);
    this.previousTreatments = optionalText(
      input.previousTreatments,
      CLINICAL_FIELD_LIMITS.previousTreatments,
    );
    this.ownerObservations = optionalText(
      input.ownerObservations,
      CLINICAL_FIELD_LIMITS.ownerObservations,
    );
  }
}
