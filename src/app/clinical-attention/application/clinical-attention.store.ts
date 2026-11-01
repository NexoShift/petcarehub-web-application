import { computed, inject, Injectable, signal } from '@angular/core';
import { AddClinicalFindingCommand } from '../domain/model/add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from '../domain/model/cancel-clinical-consultation.command';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../domain/model/clinical-attention-error';
import { ClinicalConsultation } from '../domain/model/clinical-consultation.entity';
import { CreateClinicalConsultationCommand } from '../domain/model/create-clinical-consultation.command';
import { ReevaluateDiagnosisCommand } from '../domain/model/reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from '../domain/model/register-anamnesis.command';
import { RegisterDiagnosisCommand } from '../domain/model/register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from '../domain/model/register-physiological-assessment.command';
import { CLINICAL_ATTENTION_REPOSITORY } from '../infrastructure/repositories/clinical-attention.token';

type Status = 'idle' | 'loading' | 'saving' | 'loaded' | 'error';

/** State and use cases of the clinical attention screens. Views only talk to this class. */
@Injectable({ providedIn: 'root' })
export class ClinicalAttentionStore {
  private readonly repository = inject(CLINICAL_ATTENTION_REPOSITORY);
  private readonly petConsultationsState = signal<ClinicalConsultation[]>([]);
  private readonly consultationState = signal<ClinicalConsultation | null>(null);
  private readonly status = signal<Status>('idle');
  private readonly errorState = signal<ClinicalAttentionErrorCode | null>(null);
  private readonly pendingItemsState = signal<readonly string[]>([]);
  private readonly petHistoryState = signal<ClinicalConsultation[]>([]);

  readonly petConsultations = this.petConsultationsState.asReadonly();
  readonly consultation = this.consultationState.asReadonly();
  readonly error = this.errorState.asReadonly();
  /** Items the backend reported when completing an incomplete consultation. */
  readonly pendingItems = this.pendingItemsState.asReadonly();
  /** Earlier consultations of the pet of the open consultation (context for the veterinarian). */
  readonly petHistory = this.petHistoryState.asReadonly();
  readonly isLoading = computed(() => this.status() === 'loading');
  readonly isSaving = computed(() => this.status() === 'saving');

  loadByPet(petId: number): Promise<boolean> {
    return this.run('loading', async () => {
      this.petConsultationsState.set(await this.repository.findByPetId(petId));
    });
  }

  /** Loads the pet history without touching the loading state or the error of the screen. */
  async loadPetHistory(petId: number): Promise<void> {
    try {
      this.petHistoryState.set(await this.repository.findByPetId(petId));
    } catch {
      this.petHistoryState.set([]);
    }
  }

  load(consultationId: number): Promise<boolean> {
    this.consultationState.set(null);
    return this.run('loading', async () => {
      this.consultationState.set(await this.repository.findById(consultationId));
    });
  }

  create(command: CreateClinicalConsultationCommand): Promise<boolean> {
    return this.save(() => this.repository.create(command));
  }

  start(consultationId: number): Promise<boolean> {
    return this.save(() => this.repository.start(consultationId));
  }

  registerAnamnesis(command: RegisterAnamnesisCommand): Promise<boolean> {
    return this.save(() => this.repository.registerAnamnesis(command));
  }

  registerPhysiologicalAssessment(
    command: RegisterPhysiologicalAssessmentCommand,
  ): Promise<boolean> {
    return this.save(() => this.repository.registerPhysiologicalAssessment(command));
  }

  addClinicalFinding(command: AddClinicalFindingCommand): Promise<boolean> {
    return this.save(() => this.repository.addClinicalFinding(command));
  }

  registerDiagnosis(command: RegisterDiagnosisCommand): Promise<boolean> {
    return this.save(() => this.repository.registerDiagnosis(command));
  }

  reevaluateDiagnosis(command: ReevaluateDiagnosisCommand): Promise<boolean> {
    return this.save(() => this.repository.reevaluateDiagnosis(command));
  }

  complete(consultationId: number): Promise<boolean> {
    return this.save(() => this.repository.complete(consultationId));
  }

  cancel(command: CancelClinicalConsultationCommand): Promise<boolean> {
    return this.save(() => this.repository.cancel(command));
  }

  /** For errors raised before the request is sent, such as an invalid command. */
  reportError(error: unknown): void {
    this.fail(error);
  }

  clearError(): void {
    this.errorState.set(null);
    this.pendingItemsState.set([]);
  }

  private save(action: () => Promise<ClinicalConsultation>): Promise<boolean> {
    return this.run('saving', async () => {
      const consultation = await action();
      this.consultationState.set(consultation);
      this.petConsultationsState.update((consultations) =>
        consultations.map((current) => (current.id === consultation.id ? consultation : current)),
      );
    });
  }

  private async run(status: Status, action: () => Promise<void>): Promise<boolean> {
    this.status.set(status);
    this.clearError();
    try {
      await action();
      this.status.set('loaded');
      return true;
    } catch (error) {
      this.fail(error);
      this.status.set('error');
      return false;
    }
  }

  private fail(error: unknown): void {
    if (error instanceof ClinicalAttentionError) {
      this.errorState.set(error.code);
      this.pendingItemsState.set(error.details);
    } else {
      this.errorState.set(ClinicalAttentionErrorCode.Unexpected);
      this.pendingItemsState.set([]);
    }
  }
}
