import { HistoryEntryType } from '../enums/history-entry-type.enum';

/** One event of the pet's clinical timeline, written by other contexts when something is closed. */
export class HistoryEntry {
  constructor(
    readonly id: number,
    readonly type: HistoryEntryType,
    readonly referenceId: number,
    readonly consultationId: number | null,
    readonly clinicId: number | null,
    readonly veterinarianId: number | null,
    readonly examType: string | null,
    readonly summary: string | null,
    readonly occurredAt: Date,
  ) {}

  get isConsultation(): boolean {
    return this.type === HistoryEntryType.ConsultationCompleted;
  }

  get isExamResult(): boolean {
    return this.type === HistoryEntryType.ExamResultValidated;
  }
}
