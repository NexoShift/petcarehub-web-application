import { ClinicalFileType } from '../enums/clinical-file-type.enum';
import { ExamType } from '../enums/exam-type.enum';
import { CancelClinicalExamCommand } from './cancel-clinical-exam.command';
import { ClinicalExamsErrorCode } from './clinical-exams-error';
import { RegisterExamResultCommand } from './register-exam-result.command';
import { RequestClinicalExamCommand } from './request-clinical-exam.command';
import { MAX_FILE_SIZE_BYTES, UploadClinicalFileCommand } from './upload-clinical-file.command';

function fileOf(type: string, size: number): File {
  return new File([new Uint8Array(size)], 'result', { type });
}

describe('clinical exams commands', () => {
  it('trims an empty indication to null', () => {
    const command = new RequestClinicalExamCommand(12, ExamType.Radiography, '   ');
    expect(command.indication).toBeNull();
  });

  it('rejects a request without a valid consultation', () => {
    expect(() => new RequestClinicalExamCommand(0, ExamType.Other, null)).toThrowError(
      ClinicalExamsErrorCode.InvalidRequest,
    );
  });

  it('rejects a result without summary or with a future date', () => {
    expect(() => new RegisterExamResultCommand(1, ' ', null, null, '2026-10-28')).toThrowError(
      ClinicalExamsErrorCode.InvalidResult,
    );
    expect(() => new RegisterExamResultCommand(1, 'Ok', null, null, '2999-01-01')).toThrowError(
      ClinicalExamsErrorCode.InvalidResult,
    );
  });

  it('accepts a result dated today', () => {
    const today = RegisterExamResultCommand.today();
    const command = new RegisterExamResultCommand(1, ' Ok ', '', null, today);
    expect(command.summary).toBe('Ok');
    expect(command.values).toBeNull();
  });

  it('requires a cancellation reason', () => {
    expect(() => new CancelClinicalExamCommand(1, '  ')).toThrowError(
      ClinicalExamsErrorCode.InvalidCancellation,
    );
  });

  it('accepts images, videos and pdf files up to 10 MB', () => {
    expect(new UploadClinicalFileCommand(1, fileOf('image/png', 10)).type).toBe(
      ClinicalFileType.Image,
    );
    expect(new UploadClinicalFileCommand(1, fileOf('application/pdf', 10)).type).toBe(
      ClinicalFileType.Document,
    );
  });

  it('rejects other file types and files over 10 MB', () => {
    expect(() => new UploadClinicalFileCommand(1, fileOf('text/plain', 10))).toThrowError(
      ClinicalExamsErrorCode.FileTypeNotAllowed,
    );
    expect(
      () => new UploadClinicalFileCommand(1, fileOf('video/mp4', MAX_FILE_SIZE_BYTES + 1)),
    ).toThrowError(ClinicalExamsErrorCode.FileTooLarge);
  });
});
