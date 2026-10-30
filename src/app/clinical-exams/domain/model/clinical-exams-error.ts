export enum ClinicalExamsErrorCode {
  InvalidRequest = 'clinicalExams.errors.invalidRequest',
  InvalidResult = 'clinicalExams.errors.invalidResult',
  InvalidCancellation = 'clinicalExams.errors.invalidCancellation',
  FileTypeNotAllowed = 'clinicalExams.errors.fileTypeNotAllowed',
  FileTooLarge = 'clinicalExams.errors.fileTooLarge',
  ExamNotFound = 'clinicalExams.errors.examNotFound',
  ConsultationNotAvailable = 'clinicalExams.errors.consultationNotAvailable',
  InvalidExamState = 'clinicalExams.errors.invalidExamState',
  NotAllowed = 'clinicalExams.errors.notAllowed',
  SessionExpired = 'clinicalExams.errors.sessionExpired',
  Unexpected = 'clinicalExams.errors.unexpected',
}

/** Error raised by the clinical exams context; the code doubles as a translation key. */
export class ClinicalExamsError extends Error {
  constructor(readonly code: ClinicalExamsErrorCode) {
    super(code);
    this.name = 'ClinicalExamsError';
  }
}
