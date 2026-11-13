/** Shapes of the JSON returned by /api/v1/clinical-consultations. */
export interface AnamnesisResponse {
  id: number;
  chiefComplaint: string;
  evolutionTime: string;
  symptoms: string[] | null;
  diet: string | null;
  behavior: string | null;
  previousTreatments: string | null;
  ownerObservations: string | null;
}

export interface PhysiologicalAssessmentResponse {
  id: number;
  weightKg: number;
  temperatureCelsius: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  bodyConditionScore: number | null;
  hydrationStatus: string | null;
  mucousMembranes: string | null;
  capillaryRefillTimeSeconds: number | null;
  observations: string | null;
  recordedAt: string;
}

export interface ClinicalFindingResponse {
  id: number;
  bodySystem: string;
  description: string;
  severity: string | null;
  recordedAt: string;
}

export interface DiagnosisResponse {
  id: number;
  description: string;
  type: string;
  primary: boolean;
  differentialDiagnoses: string[] | null;
  rationale: string | null;
  status: string;
  previousDiagnosisId: number | null;
  diagnosedByVeterinarianId: number;
  diagnosedAt: string;
}

export interface TreatmentResponse {
  id: number;
  description: string;
  instruction: string;
  startDateTime: Date;
  endDateTime: Date;
  treatmentStatus: string;
}

export interface ClinicalConsultationResponse {
  id: number;
  petId: number;
  veterinarianId: number;
  clinicId: number;
  consultingRoomId: number | null;
  reason: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  anamnesis: AnamnesisResponse | null;
  physiologicalAssessments: PhysiologicalAssessmentResponse[] | null;
  findings: ClinicalFindingResponse[] | null;
  diagnoses: DiagnosisResponse[] | null;
  treatments: TreatmentResponse[] | null;
  createdAt: string;
  updatedAt: string;
}
