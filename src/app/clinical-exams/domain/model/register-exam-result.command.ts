import { ClinicalExamsError, ClinicalExamsErrorCode } from './clinical-exams-error';

export const SUMMARY_MAX_LENGTH = 2000;
export const VALUES_MAX_LENGTH = 4000;
export const INTERPRETATION_MAX_LENGTH = 2000;

/** Result of an exam in process. The result date (yyyy-MM-dd) cannot be in the future. */
export class RegisterExamResultCommand {
  readonly summary: string;
  readonly values: string | null;
  readonly interpretation: string | null;

  constructor(
    readonly examId: number,
    summary: string,
    values: string | null,
    interpretation: string | null,
    readonly resultDate: string,
  ) {
    this.summary = summary.trim();
    this.values = values?.trim() || null;
    this.interpretation = interpretation?.trim() || null;
    if (
      this.summary === '' ||
      this.summary.length > SUMMARY_MAX_LENGTH ||
      (this.values?.length ?? 0) > VALUES_MAX_LENGTH ||
      (this.interpretation?.length ?? 0) > INTERPRETATION_MAX_LENGTH ||
      !/^\d{4}-\d{2}-\d{2}$/.test(resultDate) ||
      resultDate > RegisterExamResultCommand.today()
    ) {
      throw new ClinicalExamsError(ClinicalExamsErrorCode.InvalidResult);
    }
  }

  static today(): string {
    return RegisterExamResultCommand.toIsoDate(new Date());
  }

  static toIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
