/** A diagnosis becomes SUPERSEDED when a reevaluation replaces it; its content never changes. */
export enum DiagnosisStatus {
  Current = 'CURRENT',
  Superseded = 'SUPERSEDED',
}
