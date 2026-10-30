import { ExamType } from '../enums/exam-type.enum';
import { ClinicalExamsError, ClinicalExamsErrorCode } from './clinical-exams-error';

export const INDICATION_MAX_LENGTH = 500;

export class RequestClinicalExamCommand {
  readonly indication: string | null;

  constructor(
    readonly consultationId: number,
    readonly type: ExamType,
    indication: string | null,
  ) {
    const trimmed = indication?.trim() ?? '';
    if (
      !Number.isInteger(consultationId) ||
      consultationId <= 0 ||
      !Object.values(ExamType).includes(type) ||
      trimmed.length > INDICATION_MAX_LENGTH
    ) {
      throw new ClinicalExamsError(ClinicalExamsErrorCode.InvalidRequest);
    }
    this.indication = trimmed === '' ? null : trimmed;
  }
}
