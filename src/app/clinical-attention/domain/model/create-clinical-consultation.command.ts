import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { optionalId, requireId, requireText } from './command-validation';

/** Opens a consultation. The veterinarian in charge is the authenticated user. */
export class CreateClinicalConsultationCommand {
  readonly consultingRoomId: number | null;
  readonly reason: string;

  constructor(
    readonly petId: number,
    readonly clinicId: number,
    consultingRoomId: number | null,
    reason: string,
  ) {
    requireId(petId);
    requireId(clinicId);
    this.consultingRoomId = optionalId(consultingRoomId);
    this.reason = requireText(reason, CLINICAL_FIELD_LIMITS.reason);
  }
}
