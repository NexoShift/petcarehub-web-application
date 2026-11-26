/** JSON del backend: AvailableBackgroundResource. */
export interface AvailableBackgroundResponse {
  type: string;
  referenceId: number;
  date: string;
  title: string;
  summary: string;
}

/** JSON del backend: SoapDraftResource. */
export interface SoapDraftResponse {
  id: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  warnings: string[] | null;
  model: string;
  decision: string;
  editedText: string | null;
  reportUrl: string | null;
  createdAt: string;
}

/** JSON del backend: ClinicalAssistanceResource. */
export interface ClinicalAssistanceResponse {
  id: number;
  consultationId: number;
  petId: number;
  veterinarianId: number;
  currentReason: string;
  status: string;
  failureReason: string | null;
  backgrounds: { type: string; referenceId: number }[];
  drafts: SoapDraftResponse[];
  createdAt: string;
}

/** JSON del backend: OwnerExplanationResource. */
export interface OwnerExplanationResponse {
  id: number;
  petId: number;
  consultationId: number | null;
  question: string;
  answer: string;
  model: string | null;
  createdAt: string;
}
