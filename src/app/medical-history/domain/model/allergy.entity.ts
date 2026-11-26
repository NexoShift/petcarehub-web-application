import { AllergyReporter } from '../enums/allergy-reporter.enum';
import { AllergySeverity } from '../enums/allergy-severity.enum';

export class Allergy {
  constructor(
    readonly id: number,
    readonly allergen: string,
    readonly reaction: string | null,
    readonly severity: AllergySeverity,
    readonly notes: string | null,
    readonly reportedBy: AllergyReporter,
    readonly recordedAt: Date,
  ) {}

  get isSevere(): boolean {
    return this.severity === AllergySeverity.Severe;
  }

  /** Reported by the owner and not yet recorded by a veterinarian. */
  get isOwnerReported(): boolean {
    return this.reportedBy === AllergyReporter.Owner;
  }
}
