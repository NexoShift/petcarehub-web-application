import { MedicalHistoryError, MedicalHistoryErrorCode } from './medical-history-error';
import { MEDICAL_HISTORY_FIELD_LIMITS as LIMITS } from './medical-history-field-limits';

export interface VaccinationInput {
  vaccineName: string;
  appliedOn: string;
  doseNumber: number | null;
  nextDoseOn: string;
  batchNumber: string;
  notes: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Records an applied vaccine (veterinarian only). Dates are yyyy-MM-dd. */
export class RecordVaccinationCommand {
  readonly vaccineName: string;
  readonly appliedOn: string;
  readonly doseNumber: number | null;
  readonly nextDoseOn: string | null;
  readonly batchNumber: string | null;
  readonly notes: string | null;

  constructor(readonly petId: number, input: VaccinationInput, today: string) {
    const vaccineName = input.vaccineName.trim();
    const batchNumber = input.batchNumber.trim();
    const notes = input.notes.trim();
    const dose = input.doseNumber;
    if (
      !Number.isInteger(petId) || petId <= 0 ||
      !vaccineName || vaccineName.length > LIMITS.vaccineName ||
      batchNumber.length > LIMITS.batchNumber ||
      notes.length > LIMITS.vaccinationNotes ||
      (dose !== null && (!Number.isInteger(dose) || dose < 1 || dose > LIMITS.maxDoseNumber)) ||
      !ISO_DATE.test(input.appliedOn) ||
      (input.nextDoseOn !== '' && !ISO_DATE.test(input.nextDoseOn))
    ) {
      throw new MedicalHistoryError(MedicalHistoryErrorCode.InvalidVaccination);
    }
    // Cannot be applied in the future; the next dose comes after the applied one
    if (input.appliedOn > today || (input.nextDoseOn !== '' && input.nextDoseOn <= input.appliedOn)) {
      throw new MedicalHistoryError(MedicalHistoryErrorCode.InvalidVaccinationDates);
    }
    this.vaccineName = vaccineName;
    this.appliedOn = input.appliedOn;
    this.doseNumber = dose;
    this.nextDoseOn = input.nextDoseOn || null;
    this.batchNumber = batchNumber || null;
    this.notes = notes || null;
  }
}
