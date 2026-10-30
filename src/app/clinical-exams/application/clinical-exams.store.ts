import { computed, inject, Injectable, signal } from '@angular/core';
import { CancelClinicalExamCommand } from '../domain/model/cancel-clinical-exam.command';
import { ClinicalExam } from '../domain/model/clinical-exam.entity';
import { ClinicalExamsError, ClinicalExamsErrorCode } from '../domain/model/clinical-exams-error';
import { RegisterExamResultCommand } from '../domain/model/register-exam-result.command';
import { RequestClinicalExamCommand } from '../domain/model/request-clinical-exam.command';
import { UploadClinicalFileCommand } from '../domain/model/upload-clinical-file.command';
import { CLINICAL_EXAMS_REPOSITORY } from '../infrastructure/repositories/clinical-exams.token';

type Status = 'idle' | 'loading' | 'saving' | 'loaded' | 'error';

@Injectable({ providedIn: 'root' })
export class ClinicalExamsStore {
  private readonly repository = inject(CLINICAL_EXAMS_REPOSITORY);
  private readonly consultationExamsState = signal<ClinicalExam[]>([]);
  private readonly selectedExamState = signal<ClinicalExam | null>(null);
  private readonly status = signal<Status>('idle');
  private readonly errorState = signal<ClinicalExamsErrorCode | null>(null);

  readonly consultationExams = this.consultationExamsState.asReadonly();
  readonly selectedExam = this.selectedExamState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isSaving = computed(() => this.status() === 'saving');

  loadByConsultation(consultationId: number): Promise<boolean> {
    return this.run('loading', async () => {
      this.consultationExamsState.set(await this.repository.findByConsultationId(consultationId));
    });
  }

  loadExam(examId: number): Promise<boolean> {
    this.selectedExamState.set(null);
    return this.run('loading', async () => {
      this.selectedExamState.set(await this.repository.findById(examId));
    });
  }

  request(command: RequestClinicalExamCommand): Promise<boolean> {
    return this.run('saving', async () => {
      const exam = await this.repository.request(command);
      this.consultationExamsState.update((exams) => [...exams, exam]);
    });
  }

  start(examId: number): Promise<boolean> {
    return this.save(() => this.repository.start(examId));
  }

  cancel(command: CancelClinicalExamCommand): Promise<boolean> {
    return this.save(() => this.repository.cancel(command));
  }

  registerResult(command: RegisterExamResultCommand): Promise<boolean> {
    return this.save(() => this.repository.registerResult(command));
  }

  validateResult(examId: number): Promise<boolean> {
    return this.save(() => this.repository.validateResult(examId));
  }

  complete(examId: number): Promise<boolean> {
    return this.save(() => this.repository.complete(examId));
  }

  uploadFile(command: UploadClinicalFileCommand): Promise<boolean> {
    return this.run('saving', async () => {
      const file = await this.repository.uploadFile(command);
      this.selectedExamState.update((exam) => exam?.withFile(file) ?? exam);
    });
  }

  async downloadFile(examId: number, fileId: number): Promise<Blob | null> {
    this.errorState.set(null);
    try {
      return await this.repository.downloadFile(examId, fileId);
    } catch (error) {
      this.errorState.set(this.codeOf(error));
      return null;
    }
  }

  reportError(error: unknown): void {
    this.errorState.set(this.codeOf(error));
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private save(action: () => Promise<ClinicalExam>): Promise<boolean> {
    return this.run('saving', async () => {
      const exam = await action();
      this.selectedExamState.set(exam);
      this.consultationExamsState.update((exams) =>
        exams.map((current) => (current.id === exam.id ? exam : current)),
      );
    });
  }

  private async run(status: Status, action: () => Promise<void>): Promise<boolean> {
    this.status.set(status);
    this.errorState.set(null);
    try {
      await action();
      this.status.set('loaded');
      return true;
    } catch (error) {
      this.errorState.set(this.codeOf(error));
      this.status.set('error');
      return false;
    }
  }

  private codeOf(error: unknown): ClinicalExamsErrorCode {
    return error instanceof ClinicalExamsError ? error.code : ClinicalExamsErrorCode.Unexpected;
  }
}
