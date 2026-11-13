export enum ClinicalAttentionErrorCode {
  InvalidRequest = 'clinicalAttention.errors.invalidRequest',
  InvalidVitalSigns = 'clinicalAttention.errors.invalidVitalSigns',
  InvalidCancellation = 'clinicalAttention.errors.invalidCancellation',
  PetNotFound = 'clinicalAttention.errors.petNotFound',
  ConsultationNotFound = 'clinicalAttention.errors.consultationNotFound',
  InvalidConsultationState = 'clinicalAttention.errors.invalidConsultationState',
  IncompleteConsultation = 'clinicalAttention.errors.incompleteConsultation',
  DiagnosisConflict = 'clinicalAttention.errors.diagnosisConflict',
  TreatmentConflict = 'clinicalAttention.errors.treatmentConflict',
  NotAllowed = 'clinicalAttention.errors.notAllowed',
  SessionExpired = 'clinicalAttention.errors.sessionExpired',
  Unexpected = 'clinicalAttention.errors.unexpected',
}

/**
 * Error raised by the clinical attention context; the code doubles as a translation key.
 * `details` carries the pending items when a consultation cannot be completed.
 */
export class ClinicalAttentionError extends Error {
  constructor(
    readonly code: ClinicalAttentionErrorCode,
    readonly details: readonly string[] = [],
  ) {
    super(code);
    this.name = 'ClinicalAttentionError';
  }
}
