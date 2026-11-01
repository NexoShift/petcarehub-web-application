import { BodySystem } from '../enums/body-system.enum';
import { FindingSeverity } from '../enums/finding-severity.enum';

/** Something the veterinarian observed in one body system. */
export class ClinicalFinding {
  constructor(
    readonly id: number,
    readonly bodySystem: BodySystem,
    readonly description: string,
    readonly severity: FindingSeverity | null,
    readonly recordedAt: Date,
  ) {}
}
