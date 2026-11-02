import { ClinicalAttentionError, ClinicalAttentionErrorCode } from './clinical-attention-error';
import { CLINICAL_FIELD_LIMITS } from './clinical-field-limits';
import { requireId } from './command-validation';

export class CancelClinicalConsultationCommand {
  readonly reason: string;

  constructor(
    readonly consultationId: number,
    reason: string,
  ) {
    requireId(consultationId);
    const trimmed = reason?.trim() ?? '';
    if (trimmed === '' || trimmed.length > CLINICAL_FIELD_LIMITS.cancellationReason) {
      throw new ClinicalAttentionError(ClinicalAttentionErrorCode.InvalidCancellation);
    }
    this.reason = trimmed;
  }
}
