import { HydrationStatus } from '../enums/hydration-status.enum';
import { CLINICAL_FIELD_LIMITS, VITAL_SIGN_LIMITS } from './clinical-field-limits';
import {
  optionalInEnum,
  optionalText,
  optionalVitalSign,
  requireId,
  requireVitalSign,
} from './command-validation';

export interface PhysiologicalAssessmentInput {
  weightKg: number;
  temperatureCelsius: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  bodyConditionScore?: number | null;
  hydrationStatus?: HydrationStatus | null;
  mucousMembranes?: string | null;
  capillaryRefillTimeSeconds?: number | null;
  observations?: string | null;
}

/** One measurement of the pet. Each assessment is added to the consultation; none is replaced. */
export class RegisterPhysiologicalAssessmentCommand {
  readonly weightKg: number;
  readonly temperatureCelsius: number;
  readonly heartRateBpm: number;
  readonly respiratoryRateBpm: number;
  readonly bodyConditionScore: number | null;
  readonly hydrationStatus: HydrationStatus | null;
  readonly mucousMembranes: string | null;
  readonly capillaryRefillTimeSeconds: number | null;
  readonly observations: string | null;

  constructor(
    readonly consultationId: number,
    input: PhysiologicalAssessmentInput,
  ) {
    requireId(consultationId);
    this.weightKg = requireVitalSign(input.weightKg, {
      positive: true,
      max: VITAL_SIGN_LIMITS.weightKg.max,
    });
    this.temperatureCelsius = requireVitalSign(input.temperatureCelsius, {
      min: VITAL_SIGN_LIMITS.temperatureCelsius.min,
      max: VITAL_SIGN_LIMITS.temperatureCelsius.max,
    });
    this.heartRateBpm = requireVitalSign(input.heartRateBpm, {
      positive: true,
      integer: true,
      max: VITAL_SIGN_LIMITS.heartRateBpm.max,
    });
    this.respiratoryRateBpm = requireVitalSign(input.respiratoryRateBpm, {
      positive: true,
      integer: true,
      max: VITAL_SIGN_LIMITS.respiratoryRateBpm.max,
    });
    this.bodyConditionScore = optionalVitalSign(input.bodyConditionScore, {
      integer: true,
      min: VITAL_SIGN_LIMITS.bodyConditionScore.min,
      max: VITAL_SIGN_LIMITS.bodyConditionScore.max,
    });
    this.hydrationStatus = optionalInEnum(input.hydrationStatus, HydrationStatus);
    this.mucousMembranes = optionalText(
      input.mucousMembranes,
      CLINICAL_FIELD_LIMITS.mucousMembranes,
    );
    this.capillaryRefillTimeSeconds = optionalVitalSign(input.capillaryRefillTimeSeconds, {
      positive: true,
    });
    this.observations = optionalText(
      input.observations,
      CLINICAL_FIELD_LIMITS.assessmentObservations,
    );
  }
}
