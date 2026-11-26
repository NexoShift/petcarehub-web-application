/** Same limits as the backend validation, so the form stops the user before the request. */
export const MEDICAL_HISTORY_FIELD_LIMITS = {
  allergen: 150,
  reaction: 500,
  allergyNotes: 1000,
  vaccineName: 150,
  batchNumber: 50,
  vaccinationNotes: 1000,
  maxDoseNumber: 20,
} as const;
