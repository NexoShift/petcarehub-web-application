import { ClinicalFileType } from '../enums/clinical-file-type.enum';

export class ClinicalFile {
  constructor(
    readonly id: number,
    readonly fileName: string,
    readonly type: ClinicalFileType,
    readonly contentType: string,
    readonly sizeBytes: number,
    readonly uploadedAt: Date,
  ) {}

  get sizeInKilobytes(): number {
    return Math.ceil(this.sizeBytes / 1024);
  }
}
