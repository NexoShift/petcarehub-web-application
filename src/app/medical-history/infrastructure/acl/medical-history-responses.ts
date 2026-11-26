/** Shapes of the backend resources (GET /pets/{petId}/medical-history). */
export interface AllergyResponse {
  id: number;
  allergen: string;
  reaction: string | null;
  severity: string;
  notes: string | null;
  reportedBy: string;
  recordedAt: string;
}

export interface VaccinationResponse {
  id: number;
  vaccineName: string;
  doseNumber: number | null;
  appliedOn: string;
  nextDoseOn: string | null;
  batchNumber: string | null;
  notes: string | null;
  veterinarianId: number | null;
  clinicId: number | null;
}

export interface HistoryEntryResponse {
  id: number;
  type: string;
  referenceId: number;
  consultationId: number | null;
  clinicId: number | null;
  veterinarianId: number | null;
  examType: string | null;
  summary: string | null;
  occurredAt: string;
}

export interface MedicalHistoryResponse {
  petId: number;
  allergies: AllergyResponse[] | null;
  vaccinations: VaccinationResponse[] | null;
  entries: HistoryEntryResponse[] | null;
}
