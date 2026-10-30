/** Status of a clinical exam: REQUESTED -> IN_PROCESS -> COMPLETED, or CANCELLED. */
export enum ExamStatus {
  Requested = 'REQUESTED',
  InProcess = 'IN_PROCESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}
