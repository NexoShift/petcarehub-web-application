import { BodySystem } from '../enums/body-system.enum';
import { FindingSeverity } from '../enums/finding-severity.enum';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { optionalInEnum, requireId, requireInEnum, requireText } from './command-validation';

export class AddClinicalFindingCommand {
  readonly bodySystem: BodySystem;
  readonly description: string;
  readonly severity: FindingSeverity | null;

  constructor(
    readonly consultationId: number,
    bodySystem: BodySystem | null,
    description: string,
    severity: FindingSeverity | null,
  ) {
    requireId(consultationId);
    this.bodySystem = requireInEnum(bodySystem, BodySystem);
    this.description = requireText(description, CLINICAL_FIELD_LIMITS.findingDescription);
    this.severity = optionalInEnum(severity, FindingSeverity);
  }
}
