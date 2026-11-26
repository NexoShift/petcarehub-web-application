import { computed, inject, Injectable, signal } from '@angular/core';
import { MedicalHistory } from '../domain/model/medical-history.entity';
import { MedicalHistoryError, MedicalHistoryErrorCode } from '../domain/model/medical-history-error';
import { RecordAllergyCommand } from '../domain/model/record-allergy.command';
import { RecordVaccinationCommand } from '../domain/model/record-vaccination.command';
import { MEDICAL_HISTORY_REPOSITORY } from '../infrastructure/repositories/medical-history.token';

type Status = 'idle' | 'loading' | 'saving' | 'loaded' | 'error';

/** Medical history of the selected pet (allergies, vaccinations and timeline). */
@Injectable({ providedIn: 'root' })
export class MedicalHistoryStore {
  private readonly repository = inject(MEDICAL_HISTORY_REPOSITORY);
  private readonly historyState = signal<MedicalHistory | null>(null);
  private readonly status = signal<Status>('idle');
  private readonly errorState = signal<MedicalHistoryErrorCode | null>(null);
  /** Last pet requested: a slow answer for another pet must not replace it. */
  private requestedPetId: number | null = null;

  readonly history = this.historyState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isSaving = computed(() => this.status() === 'saving');

  async load(petId: number): Promise<boolean> {
    this.requestedPetId = petId;
    this.historyState.set(null);
    return this.run('loading', async () => {
      const history = await this.repository.findByPetId(petId);
      if (this.requestedPetId === petId) this.historyState.set(history);
    });
  }

  recordAllergy(command: RecordAllergyCommand): Promise<boolean> {
    return this.run('saving', async () => {
      this.historyState.set(await this.repository.recordAllergy(command));
    });
  }

  recordVaccination(command: RecordVaccinationCommand): Promise<boolean> {
    return this.run('saving', async () => {
      this.historyState.set(await this.repository.recordVaccination(command));
    });
  }

  /** For validation errors raised by a command before calling the API. */
  fail(error: unknown): void {
    this.errorState.set(this.codeOf(error));
  }

  clearError(): void {
    this.errorState.set(null);
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

  private codeOf(error: unknown): MedicalHistoryErrorCode {
    return error instanceof MedicalHistoryError ? error.code : MedicalHistoryErrorCode.Unexpected;
  }
}
