export enum MedicalHistoryErrorCode {
  InvalidAllergy = 'medicalHistory.errors.invalidAllergy',
  InvalidVaccination = 'medicalHistory.errors.invalidVaccination',
  InvalidVaccinationDates = 'medicalHistory.errors.invalidVaccinationDates',
  PetNotFound = 'medicalHistory.errors.petNotFound',
  NotAllowed = 'medicalHistory.errors.notAllowed',
  SessionExpired = 'medicalHistory.errors.sessionExpired',
  Unexpected = 'medicalHistory.errors.unexpected',
}

/** Error raised by the medical history context; the code doubles as a translation key. */
export class MedicalHistoryError extends Error {
  constructor(readonly code: MedicalHistoryErrorCode) {
    super(code);
    this.name = 'MedicalHistoryError';
  }
}
