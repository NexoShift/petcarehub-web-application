/** Maximum lengths accepted by the API. They mirror ClinicalFieldLimits in the backend. */
export const CLINICAL_FIELD_LIMITS = {
  reason: 350,
  chiefComplaint: 350,
  evolutionTime: 100,
  symptom: 100,
  maxSymptoms: 20,
  diet: 500,
  behavior: 500,
  previousTreatments: 1000,
  ownerObservations: 1000,
  mucousMembranes: 100,
  assessmentObservations: 2000,
  findingDescription: 1000,
  diagnosisDescription: 500,
  differentialDiagnosis: 200,
  maxDifferentialDiagnoses: 10,
  rationale: 2000,
  cancellationReason: 500,
} as const;

/** Ranges accepted for the vital signs of a physiological assessment. */
export const VITAL_SIGN_LIMITS = {
  weightKg: { max: 500 },
  temperatureCelsius: { min: 30, max: 45 },
  heartRateBpm: { max: 600 },
  respiratoryRateBpm: { max: 300 },
  bodyConditionScore: { min: 1, max: 9 },
} as const;
