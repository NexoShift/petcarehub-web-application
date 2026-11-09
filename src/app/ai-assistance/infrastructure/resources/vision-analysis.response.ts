/** Forma exacta del JSON del backend (VisionFindingResource). Coordenadas null en radiografías. */
export interface VisionFindingResponse {
  id: number;
  label: string;
  confidencePercentage: number;
  probable: boolean;
  hasLocation: boolean;
  left: number | null;
  top: number | null;
  width: number | null;
  height: number | null;
}

/** Forma exacta del JSON del backend (VisionAnalysisResource). */
export interface VisionAnalysisResponse {
  id: number;
  petId: number;
  consultationId: number | null;
  imageType: string;
  status: string;
  modelId: string | null;
  failureReason: string | null;
  requestedByRole: string;
  imageUrl: string;
  findings: VisionFindingResponse[];
  createdAt: string;
}
