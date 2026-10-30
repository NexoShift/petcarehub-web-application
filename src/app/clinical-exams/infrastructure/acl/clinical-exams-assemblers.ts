import { ClinicalFileType } from '../../domain/enums/clinical-file-type.enum';
import { ExamStatus } from '../../domain/enums/exam-status.enum';
import { ExamType } from '../../domain/enums/exam-type.enum';
import { ClinicalExam } from '../../domain/model/clinical-exam.entity';
import {
  ClinicalExamsError,
  ClinicalExamsErrorCode,
} from '../../domain/model/clinical-exams-error';
import { ClinicalFile } from '../../domain/model/clinical-file.entity';
import { ExamResult } from '../../domain/model/exam-result.entity';
import {
  ClinicalExamResponse,
  ClinicalFileResponse,
  ExamResultResponse,
} from './clinical-exams-responses';

const toDate = (value: string | null): Date | null => (value ? new Date(value) : null);

export function toClinicalFile(response: ClinicalFileResponse): ClinicalFile {
  return new ClinicalFile(
    response.id,
    response.fileName,
    response.type as ClinicalFileType,
    response.contentType,
    response.sizeBytes,
    new Date(response.uploadedAt),
  );
}

export function toExamResult(response: ExamResultResponse): ExamResult {
  return new ExamResult(
    response.id,
    response.summary,
    response.values,
    response.interpretation,
    response.resultDate,
    response.validated,
    response.validatedBy,
    toDate(response.validatedAt),
  );
}

export function toClinicalExam(response: ClinicalExamResponse): ClinicalExam {
  return new ClinicalExam({
    id: response.id,
    consultationId: response.consultationId,
    petId: response.petId,
    requestedBy: response.requestedBy,
    type: response.type as ExamType,
    indication: response.indication,
    status: response.status as ExamStatus,
    requestedAt: new Date(response.requestedAt),
    startedAt: toDate(response.startedAt),
    completedAt: toDate(response.completedAt),
    cancellationReason: response.cancellationReason,
    cancelledAt: toDate(response.cancelledAt),
    result: response.result ? toExamResult(response.result) : null,
    files: response.files.map(toClinicalFile),
  });
}

/** Translates an HTTP status into a domain error. 409 means a different rule per operation. */
export function toClinicalExamsError(
  status: number,
  conflictCode = ClinicalExamsErrorCode.InvalidExamState,
): ClinicalExamsError {
  switch (status) {
    case 400:
      return new ClinicalExamsError(ClinicalExamsErrorCode.InvalidRequest);
    case 401:
      return new ClinicalExamsError(ClinicalExamsErrorCode.SessionExpired);
    case 403:
      return new ClinicalExamsError(ClinicalExamsErrorCode.NotAllowed);
    case 404:
      return new ClinicalExamsError(ClinicalExamsErrorCode.ExamNotFound);
    case 409:
      return new ClinicalExamsError(conflictCode);
    default:
      return new ClinicalExamsError(ClinicalExamsErrorCode.Unexpected);
  }
}
