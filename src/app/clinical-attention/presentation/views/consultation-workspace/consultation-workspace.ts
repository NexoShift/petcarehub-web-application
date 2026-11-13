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
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConsultationImaging } from '../../../../ai-assistance';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';
import { AddClinicalFindingCommand } from '../../../domain/model/add-clinical-finding.command';
import { CancelClinicalConsultationCommand } from '../../../domain/model/cancel-clinical-consultation.command';
import {
  ClinicalAttentionError,
  ClinicalAttentionErrorCode,
} from '../../../domain/model/clinical-attention-error';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { ReevaluateDiagnosisCommand } from '../../../domain/model/reevaluate-diagnosis.command';
import { RegisterAnamnesisCommand } from '../../../domain/model/register-anamnesis.command';
import { RegisterDiagnosisCommand } from '../../../domain/model/register-diagnosis.command';
import { RegisterPhysiologicalAssessmentCommand } from '../../../domain/model/register-physiological-assessment.command';
import {
  AnamnesisFormValue,
  AnamnesisPanel,
} from '../../components/anamnesis-panel/anamnesis-panel';
import {
  AssessmentFormValue,
  AssessmentPanel,
} from '../../components/assessment-panel/assessment-panel';
import { CancelConsultationDialog } from '../../components/cancel-consultation-dialog/cancel-consultation-dialog';
import { CompletionPanel } from '../../components/completion-panel/completion-panel';
import {
  AVAILABLE_PHASES,
  ConsultationPhaseId,
} from '../../components/consultation-phases/consultation-phase';
import { ConsultationPhases } from '../../components/consultation-phases/consultation-phases';
import { ConsultationStatusChip } from '../../components/consultation-status-chip/consultation-status-chip';
import { DiagnosisFormValue } from '../../components/diagnosis-form/diagnosis-form';
import {
  DiagnosisPanel,
  DiagnosisReevaluation,
} from '../../components/diagnosis-panel/diagnosis-panel';
import { FindingFormValue, FindingsPanel } from '../../components/findings-panel/findings-panel';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';

/** Nombres de Profiles para mostrar en vez de los ids. */
interface ConsultationNames {
  pet: Pet | null;
  owner: string | null;
  ownerPhone: string | null;
  veterinarian: string | null;
  clinic: string | null;
  room: string | null;
}

/**
 * One consultation, phase by phase (MW-23 to MW-26). A consultation that was started shows the
 * phase flow; a completed or cancelled one is a closed record and is shown read-only (MW-27).
 */
@Component({
  selector: 'app-consultation-workspace',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    AnamnesisPanel,
    AssessmentPanel,
    CompletionPanel,
    ConsultationImaging,
    ConsultationPhases,
    ConsultationStatusChip,
    DiagnosisPanel,
    FindingsPanel,
    Icon,
    PetAvatar,
  ],
  templateUrl: './consultation-workspace.html',
  styleUrls: ['../../clinical-attention.css', './consultation-workspace.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationWorkspace {
  readonly consultationId = input.required<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly profiles = inject(ProfileApi);

  protected readonly Status = ConsultationStatus;
  protected readonly consultation = this.store.consultation;
  protected readonly phase = signal<ConsultationPhaseId>('anamnesis');

  protected readonly phaseIndex = computed(() => AVAILABLE_PHASES.indexOf(this.phase()));
  protected readonly isFirstPhase = computed(() => this.phaseIndex() <= 0);
  protected readonly isLastPhase = computed(() => this.phaseIndex() >= AVAILABLE_PHASES.length - 1);

  /** Earlier consultations of the same pet, newest first, without the open one. */
  protected readonly history = computed(() =>
    this.store
      .petHistory()
      .filter((previous) => previous.id !== this.consultation()?.id)
      .slice(0, 5),
  );

  protected readonly names = signal<ConsultationNames>({
    pet: null,
    owner: null,
    ownerPhone: null,
    veterinarian: null,
    clinic: null,
    room: null,
  });
  private namesFor: number | null = null;

  constructor() {
    effect(() => {
      const consultationId = Number(this.consultationId());
      untracked(() => void this.open(consultationId));
    });
    // Cuando llega la consulta, pide a Profiles los nombres (una vez por consulta)
    effect(() => {
      const consultation = this.consultation();
      if (consultation && consultation.id !== this.namesFor) {
        this.namesFor = consultation.id;
        untracked(() => this.loadNames(consultation));
      }
    });
  }

  private loadNames(c: ClinicalConsultation): void {
    const set = (patch: Partial<ConsultationNames>) =>
      this.names.update((n) => ({ ...n, ...patch }));
    this.names.set({
      pet: null,
      owner: null,
      ownerPhone: null,
      veterinarian: null,
      clinic: null,
      room: null,
    });
    this.profiles.getPetById(c.petId).subscribe({
      next: (pet) => {
        set({ pet });
        this.profiles.getPetOwnerById(pet.ownerId).subscribe({
          next: (o) => set({ owner: `${o.firstName} ${o.lastName}`, ownerPhone: o.phoneNumber }),
          error: () => undefined,
        });
      },
      error: () => undefined,
    });
    // La consulta guarda el id del perfil del veterinario (Profiles)
    this.profiles.getVeterinarianById(c.veterinarianId).subscribe({
      next: (v) => set({ veterinarian: `${v.firstName} ${v.lastName}` }),
      error: () => undefined,
    });
    this.profiles.getClinicById(c.clinicId).subscribe({
      next: (clinic) => set({ clinic: clinic.name }),
      error: () => undefined,
    });
    if (c.consultingRoomId) {
      this.profiles.getConsultingRoomById(c.clinicId, c.consultingRoomId).subscribe({
        next: (r) => set({ room: r.name }),
        error: () => undefined,
      });
    }
  }

  protected selectPhase(phase: ConsultationPhaseId): void {
    this.phase.set(phase);
  }

  protected move(step: -1 | 1): void {
    const next = AVAILABLE_PHASES[this.phaseIndex() + step];
    if (next) this.phase.set(next);
  }

  protected async start(consultation: ClinicalConsultation): Promise<void> {
    await this.notify(this.store.start(consultation.id), 'clinicalAttention.workspace.started');
    const started = this.consultation();
    if (started) this.phase.set(this.firstPendingPhase(started));
  }

  protected cancel(consultation: ClinicalConsultation): void {
    this.dialog
      .open<CancelConsultationDialog, void, string>(CancelConsultationDialog)
      .afterClosed()
      .subscribe((reason) => {
        if (reason) {
          void this.cancelWith(consultation, reason);
        }
      });
  }

  protected async registerAnamnesis(
    consultation: ClinicalConsultation,
    value: AnamnesisFormValue,
  ): Promise<void> {
    const command = this.build(() => new RegisterAnamnesisCommand(consultation.id, value));
    if (!command) return;
    if (
      await this.notify(
        this.store.registerAnamnesis(command),
        'clinicalAttention.anamnesis.registered',
      )
    ) {
      this.phase.set('assessment');
    }
  }

  protected async registerAssessment(
    consultation: ClinicalConsultation,
    value: AssessmentFormValue,
  ): Promise<void> {
    const command = this.build(
      () =>
        new RegisterPhysiologicalAssessmentCommand(consultation.id, {
          ...value,
          weightKg: value.weightKg as number,
          temperatureCelsius: value.temperatureCelsius as number,
          heartRateBpm: value.heartRateBpm as number,
          respiratoryRateBpm: value.respiratoryRateBpm as number,
        }),
    );
    if (!command) return;
    await this.notify(
      this.store.registerPhysiologicalAssessment(command),
      'clinicalAttention.assessment.registered',
    );
  }

  protected async addFinding(
    consultation: ClinicalConsultation,
    value: FindingFormValue,
  ): Promise<void> {
    const command = this.build(
      () =>
        new AddClinicalFindingCommand(
          consultation.id,
          value.bodySystem,
          value.description,
          value.severity,
        ),
    );
    if (!command) return;
    await this.notify(this.store.addClinicalFinding(command), 'clinicalAttention.findings.added');
  }

  protected async registerDiagnosis(
    consultation: ClinicalConsultation,
    value: DiagnosisFormValue,
  ): Promise<void> {
    const command = this.build(
      () => new RegisterDiagnosisCommand(consultation.id, value, value.primary),
    );
    if (!command) return;
    await this.notify(
      this.store.registerDiagnosis(command),
      'clinicalAttention.diagnosis.registered',
    );
  }

  protected async reevaluateDiagnosis(
    consultation: ClinicalConsultation,
    reevaluation: DiagnosisReevaluation,
  ): Promise<void> {
    const command = this.build(
      () =>
        new ReevaluateDiagnosisCommand(
          consultation.id,
          reevaluation.diagnosisId,
          reevaluation.value,
        ),
    );
    if (!command) return;
    await this.notify(
      this.store.reevaluateDiagnosis(command),
      'clinicalAttention.diagnosis.reevaluated',
    );
  }

  protected async complete(consultation: ClinicalConsultation): Promise<void> {
    await this.notify(
      this.store.complete(consultation.id),
      'clinicalAttention.completion.completed',
    );
  }

  private async open(consultationId: number): Promise<void> {
    this.store.clearError();
    if (!Number.isInteger(consultationId) || consultationId <= 0) {
      this.store.reportError(
        new ClinicalAttentionError(ClinicalAttentionErrorCode.ConsultationNotFound),
      );
      return;
    }
    if (!(await this.store.load(consultationId))) return;
    const consultation = this.store.consultation();
    if (!consultation) return;
    this.phase.set(this.firstPendingPhase(consultation));
    void this.store.loadPetHistory(consultation.petId);
  }

  private async cancelWith(consultation: ClinicalConsultation, reason: string): Promise<void> {
    const command = this.build(
      () => new CancelClinicalConsultationCommand(consultation.id, reason),
    );
    if (!command) return;
    await this.notify(this.store.cancel(command), 'clinicalAttention.workspace.cancelled');
  }

  /** Opens the first phase that still lacks data, so the veterinarian continues where they left. */
  private firstPendingPhase(consultation: ClinicalConsultation): ConsultationPhaseId {
    if (consultation.anamnesis === null) return 'anamnesis';
    if (consultation.physiologicalAssessments.length === 0) return 'assessment';
    if (consultation.primaryDiagnosis === null) return 'diagnosis';
    return 'completion';
  }

  /** Builds a command; an invalid one is reported through the store instead of being thrown. */
  private build<T>(factory: () => T): T | null {
    try {
      return factory();
    } catch (error) {
      this.store.reportError(error);
      return null;
    }
  }

  private async notify(action: Promise<boolean>, messageKey: string): Promise<boolean> {
    const done = await action;
    if (done) {
      this.snackBar.open(
        this.translate.instant(messageKey),
        this.translate.instant('clinicalAttention.close'),
        { duration: 3000 },
      );
    }
    return done;
  }
}
