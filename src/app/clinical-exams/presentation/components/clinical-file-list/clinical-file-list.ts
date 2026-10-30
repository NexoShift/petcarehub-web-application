import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { ClinicalFileType } from '../../../domain/enums/clinical-file-type.enum';
import { ClinicalFile } from '../../../domain/model/clinical-file.entity';
import { ACCEPTED_FILE_TYPES } from '../../../domain/model/upload-clinical-file.command';

@Component({
  selector: 'app-clinical-file-list',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatListModule, TranslatePipe],
  templateUrl: './clinical-file-list.html',
  styleUrl: './clinical-file-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalFileList {
  readonly files = input.required<ClinicalFile[]>();
  readonly canUpload = input(false);
  readonly saving = input(false);
  readonly fileSelected = output<File>();
  readonly downloadRequested = output<ClinicalFile>();

  protected readonly acceptedTypes = ACCEPTED_FILE_TYPES;
  protected readonly icons: Record<ClinicalFileType, string> = {
    [ClinicalFileType.Image]: 'image',
    [ClinicalFileType.Video]: 'movie',
    [ClinicalFileType.Document]: 'picture_as_pdf',
  };

  protected select(input: HTMLInputElement): void {
    const file = input.files?.item(0);
    input.value = '';
    if (file) {
      this.fileSelected.emit(file);
    }
  }
}
