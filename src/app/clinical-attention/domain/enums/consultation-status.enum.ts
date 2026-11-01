/** Life cycle of a consultation: CREATED -> IN_PROGRESS -> COMPLETED, or CANCELLED before completion. */
export enum ConsultationStatus {
  Created = 'CREATED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}
