export interface ClinicalFileResponse {
  id: number;
  fileName: string;
  type: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ExamResultResponse {
  id: number;
  summary: string;
  values: string | null;
  interpretation: string | null;
  resultDate: string;
  validated: boolean;
  validatedBy: number | null;
  validatedAt: string | null;
}

export interface ClinicalExamResponse {
  id: number;
  consultationId: number;
  petId: number;
  requestedBy: number;
  type: string;
  indication: string | null;
  status: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  result: ExamResultResponse | null;
  files: ClinicalFileResponse[];
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details: string[];
}
