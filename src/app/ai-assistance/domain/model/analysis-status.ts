/** Estado final de un análisis en el backend. */
export enum AnalysisStatus {
  Completed = 'COMPLETED',
  /** Roboflow falló (503): queda guardado con failureReason. */
  Failed = 'FAILED',
}

/** Quién pidió el análisis. */
export enum RequesterRole {
  Veterinarian = 'VETERINARIAN',
  PetOwner = 'PET_OWNER',
}
