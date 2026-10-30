import { ClinicalFileType } from '../enums/clinical-file-type.enum';
import { ClinicalExamsError, ClinicalExamsErrorCode } from './clinical-exams-error';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = 'image/*,video/*,application/pdf';

/** Upload of an image, video or PDF of up to 10 MB to an exam. */
export class UploadClinicalFileCommand {
  readonly type: ClinicalFileType;

  constructor(
    readonly examId: number,
    readonly file: File,
  ) {
    this.type = UploadClinicalFileCommand.typeOf(file.type);
    if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
      throw new ClinicalExamsError(ClinicalExamsErrorCode.FileTooLarge);
    }
  }

  private static typeOf(contentType: string): ClinicalFileType {
    if (contentType.startsWith('image/')) return ClinicalFileType.Image;
    if (contentType.startsWith('video/')) return ClinicalFileType.Video;
    if (contentType === 'application/pdf') return ClinicalFileType.Document;
    throw new ClinicalExamsError(ClinicalExamsErrorCode.FileTypeNotAllowed);
  }
}
