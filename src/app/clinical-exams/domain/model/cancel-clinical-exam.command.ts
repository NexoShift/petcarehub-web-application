import { ClinicalExamsError, ClinicalExamsErrorCode } from './clinical-exams-error';

export const REASON_MAX_LENGTH = 500;

export class CancelClinicalExamCommand {
  readonly reason: string;

  constructor(
    readonly examId: number,
    reason: string,
  ) {
    this.reason = reason.trim();
    if (this.reason === '' || this.reason.length > REASON_MAX_LENGTH) {
      throw new ClinicalExamsError(ClinicalExamsErrorCode.InvalidCancellation);
    }
  }
}
