import { AllergyReporter } from '../../domain/enums/allergy-reporter.enum';
import { AllergySeverity } from '../../domain/enums/allergy-severity.enum';
import { HistoryEntryType } from '../../domain/enums/history-entry-type.enum';
import { Allergy } from '../../domain/model/allergy.entity';
import { HistoryEntry } from '../../domain/model/history-entry.entity';
import { MedicalHistory } from '../../domain/model/medical-history.entity';
import { MedicalHistoryError, MedicalHistoryErrorCode } from '../../domain/model/medical-history-error';
import { Vaccination } from '../../domain/model/vaccination.entity';
import {
  AllergyResponse,
  HistoryEntryResponse,
  MedicalHistoryResponse,
  VaccinationResponse,
} from './medical-history-responses';

export function toAllergy(r: AllergyResponse): Allergy {
  return new Allergy(
    r.id,
    r.allergen,
    r.reaction ?? null,
    r.severity as AllergySeverity,
    r.notes ?? null,
    r.reportedBy as AllergyReporter,
    new Date(r.recordedAt),
  );
}

export function toVaccination(r: VaccinationResponse): Vaccination {
  return new Vaccination(
    r.id,
    r.vaccineName,
    r.doseNumber ?? null,
    r.appliedOn,
    r.nextDoseOn ?? null,
    r.batchNumber ?? null,
    r.notes ?? null,
    r.veterinarianId ?? null,
    r.clinicId ?? null,
  );
}

export function toHistoryEntry(r: HistoryEntryResponse): HistoryEntry {
  return new HistoryEntry(
    r.id,
    r.type as HistoryEntryType,
    r.referenceId,
    r.consultationId ?? null,
    r.clinicId ?? null,
    r.veterinarianId ?? null,
    r.examType ?? null,
    r.summary ?? null,
    new Date(r.occurredAt),
  );
}

export function toMedicalHistory(r: MedicalHistoryResponse): MedicalHistory {
  return new MedicalHistory(
    r.petId,
    (r.allergies ?? []).map(toAllergy),
    (r.vaccinations ?? []).map(toVaccination),
    (r.entries ?? []).map(toHistoryEntry),
  );
}

export function toMedicalHistoryError(
  status: number,
  badRequestCode = MedicalHistoryErrorCode.Unexpected,
): MedicalHistoryError {
  switch (status) {
    case 400:
      return new MedicalHistoryError(badRequestCode);
    case 401:
      return new MedicalHistoryError(MedicalHistoryErrorCode.SessionExpired);
    case 403:
      return new MedicalHistoryError(MedicalHistoryErrorCode.NotAllowed);
    case 404:
      return new MedicalHistoryError(MedicalHistoryErrorCode.PetNotFound);
    default:
      return new MedicalHistoryError(MedicalHistoryErrorCode.Unexpected);
  }
}
