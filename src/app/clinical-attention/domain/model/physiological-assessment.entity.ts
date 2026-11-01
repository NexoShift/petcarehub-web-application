import { HydrationStatus } from '../enums/hydration-status.enum';

export interface PhysiologicalAssessmentProps {
  id: number;
  weightKg: number;
  temperatureCelsius: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  bodyConditionScore: number | null;
  hydrationStatus: HydrationStatus | null;
  mucousMembranes: string | null;
  capillaryRefillTimeSeconds: number | null;
  observations: string | null;
  recordedAt: Date;
}

/** One measurement of the pet taken during the consultation. */
export class PhysiologicalAssessment {
  readonly id: number;
  readonly weightKg: number;
  readonly temperatureCelsius: number;
  readonly heartRateBpm: number;
  readonly respiratoryRateBpm: number;
  readonly bodyConditionScore: number | null;
  readonly hydrationStatus: HydrationStatus | null;
  readonly mucousMembranes: string | null;
  readonly capillaryRefillTimeSeconds: number | null;
  readonly observations: string | null;
  readonly recordedAt: Date;

  constructor(props: PhysiologicalAssessmentProps) {
    this.id = props.id;
    this.weightKg = props.weightKg;
    this.temperatureCelsius = props.temperatureCelsius;
    this.heartRateBpm = props.heartRateBpm;
    this.respiratoryRateBpm = props.respiratoryRateBpm;
    this.bodyConditionScore = props.bodyConditionScore;
    this.hydrationStatus = props.hydrationStatus;
    this.mucousMembranes = props.mucousMembranes;
    this.capillaryRefillTimeSeconds = props.capillaryRefillTimeSeconds;
    this.observations = props.observations;
    this.recordedAt = props.recordedAt;
  }
}
