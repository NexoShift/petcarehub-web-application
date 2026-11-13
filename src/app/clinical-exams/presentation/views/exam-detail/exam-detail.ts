import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { ClinicalExamsStore } from '../../../application/clinical-exams.store';
import { CancelClinicalExamCommand } from '../../../domain/model/cancel-clinical-exam.command';
import { ClinicalExam } from '../../../domain/model/clinical-exam.entity';
import { ClinicalFile } from '../../../domain/model/clinical-file.entity';
import { RegisterExamResultCommand } from '../../../domain/model/register-exam-result.command';
import { UploadClinicalFileCommand } from '../../../domain/model/upload-clinical-file.command';
import { CancelExamDialog } from '../../components/cancel-exam-dialog/cancel-exam-dialog';
import { ClinicalFileList } from '../../components/clinical-file-list/clinical-file-list';
import {
  ExamResultForm,
  ExamResultFormValue,
} from '../../components/exam-result-form/exam-result-form';
import { ExamStatusChip } from '../../components/exam-status-chip/exam-status-chip';
import { EXAM_TYPE_ICONS } from '../../exam-type-icon';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

@Component({
  selector: 'app-exam-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    ClinicalFileList,
    ExamResultForm,
    TranslatePipe,
    ExamStatusChip,
    Icon,
  ],
  templateUrl: './exam-detail.html',
  styleUrls: ['../clinical-exams.css', './exam-detail.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamDetail {
  readonly examId = input.required<string>();

  protected readonly store = inject(ClinicalExamsStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly exam = this.store.selectedExam;
  private readonly profiles = inject(ProfileApi);
  protected readonly petName = signal<string | null>(null);
  protected readonly typeIcons = EXAM_TYPE_ICONS;

  /** Pasos del examen para la línea de progreso; el primero sin hacer es el actual. */
  protected readonly steps = computed(() => {
    const exam = this.exam();
    if (!exam) return [];
    const steps = [
      { key: 'requested', date: exam.requestedAt, done: true },
      { key: 'inProcess', date: exam.startedAt, done: exam.startedAt !== null },
      { key: 'validated', date: exam.result?.validatedAt ?? null, done: !!exam.result?.validated },
      { key: 'completed', date: exam.completedAt, done: exam.completedAt !== null },
    ];
    const current = steps.findIndex((step) => !step.done);
    return steps.map((step, index) => ({ ...step, current: index === current }));
  });

  constructor() {
    effect(() => {
      const examId = Number(this.examId());
      untracked(async () => {
        if (await this.store.loadExam(examId)) {
          const exam = this.store.selectedExam();
          if (exam) {
            this.profiles.getPetById(exam.petId).subscribe({
              next: (pet) => this.petName.set(pet.name),
              error: () => undefined,
            });
          }
        }
      });
    });
  }

  protected async start(exam: ClinicalExam): Promise<void> {
    await this.notify(this.store.start(exam.id), 'clinicalExams.detail.started');
  }

  protected cancel(exam: ClinicalExam): void {
    this.dialog
      .open<CancelExamDialog, void, string>(CancelExamDialog)
      .afterClosed()
      .subscribe((reason) => {
        if (reason) {
          void this.notify(
            this.store.cancel(new CancelClinicalExamCommand(exam.id, reason)),
            'clinicalExams.detail.cancelled',
          );
        }
      });
  }

  protected async registerResult(exam: ClinicalExam, value: ExamResultFormValue): Promise<void> {
    let command: RegisterExamResultCommand;
    try {
      command = new RegisterExamResultCommand(
        exam.id,
        value.summary,
        value.values,
        value.interpretation,
        value.resultDate,
      );
    } catch (error) {
      this.store.reportError(error);
      return;
    }
    await this.notify(this.store.registerResult(command), 'clinicalExams.detail.resultRegistered');
  }

  protected async validateResult(exam: ClinicalExam): Promise<void> {
    await this.notify(this.store.validateResult(exam.id), 'clinicalExams.detail.resultValidated');
  }

  protected async complete(exam: ClinicalExam): Promise<void> {
    await this.notify(this.store.complete(exam.id), 'clinicalExams.detail.completed');
  }

  protected async upload(exam: ClinicalExam, file: File): Promise<void> {
    let command: UploadClinicalFileCommand;
    try {
      command = new UploadClinicalFileCommand(exam.id, file);
    } catch (error) {
      this.store.reportError(error);
      return;
    }
    await this.notify(this.store.uploadFile(command), 'clinicalExams.detail.fileUploaded');
  }

  protected async download(exam: ClinicalExam, file: ClinicalFile): Promise<void> {
    const blob = await this.store.downloadFile(exam.id, file.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private async notify(action: Promise<boolean>, messageKey: string): Promise<void> {
    if (await action) {
      this.snackBar.open(
        this.translate.instant(messageKey),
        this.translate.instant('clinicalExams.close'),
        { duration: 3000 },
      );
    }
  }
}
