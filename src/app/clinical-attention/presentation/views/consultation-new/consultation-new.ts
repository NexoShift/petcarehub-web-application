import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';
import { CreateClinicalConsultationCommand } from '../../../domain/model/create-clinical-consultation.command';
import { IamStore } from '../../../../iam';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Clinic } from '../../../../profiles/domain/model/clinic.entity';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { ConsultingRoom } from '../../../../profiles/domain/model/consulting-room.entity';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';

/** Opens a consultation (US01). The veterinarian in charge is the signed-in user. */
@Component({
  selector: 'app-consultation-new',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    Icon,
    PetAvatar,
  ],
  templateUrl: './consultation-new.html',
  styleUrl: './consultation-new.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationNew implements OnInit {
  /** Bound from the `petId` query parameter to prefill the form. */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  protected readonly reasonMaxLength = CLINICAL_FIELD_LIMITS.reason;

  /** Datos de Profiles para los selectores: la clínica sale de la cuenta del usuario. */
  protected readonly clinic = signal<Clinic | null>(null);
  protected readonly patients = signal<Pet[]>([]);
  protected readonly rooms = signal<ConsultingRoom[]>([]);
  protected readonly loadError = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    petId: [null as number | null, [Validators.required, Validators.min(1)]],
    clinicId: [null as number | null, [Validators.required, Validators.min(1)]],
    consultingRoomId: [null as number | null, Validators.min(1)],
    reason: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(this.reasonMaxLength)],
    ],
  });

  /** Mascota elegida en el selector, para la tarjeta de vista previa. */
  private readonly petIdValue = toSignal(this.form.controls.petId.valueChanges, {
    initialValue: this.form.controls.petId.value,
  });
  protected readonly selectedPet = computed(() =>
    this.patients().find(p => p.id === this.petIdValue()) ?? null,
  );

  ngOnInit(): void {
    this.store.clearError();
    const petId = Number(this.petId());
    if (Number.isInteger(petId) && petId > 0) {
      this.form.controls.petId.setValue(petId);
    }
    this.loadClinicData();
  }

  /** Clínica de la cuenta → sus pacientes y sus consultorios activos. */
  private loadClinicData(): void {
    const user = this.iam.currentUser();
    if (!user) return;
    this.profiles.getClinicByAccountId(user.accountId).subscribe({
      next: clinic => {
        this.clinic.set(clinic);
        this.form.controls.clinicId.setValue(clinic.id);
        this.profiles.getPatientsByClinicId(clinic.id).subscribe({
          next: pets => this.patients.set(pets),
          error: () => this.loadError.set(true),
        });
        this.profiles.getConsultingRoomsByClinicId(clinic.id).subscribe({
          next: rooms => this.rooms.set(rooms.filter(r => r.active)),
          error: () => this.rooms.set([]),
        });
      },
      error: () => this.loadError.set(true),
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    let command: CreateClinicalConsultationCommand;
    try {
      command = new CreateClinicalConsultationCommand(
        value.petId as number,
        value.clinicId as number,
        value.consultingRoomId,
        value.reason,
      );
    } catch (error) {
      this.store.reportError(error);
      return;
    }
    if (await this.store.create(command)) {
      const consultation = this.store.consultation();
      this.snackBar.open(
        this.translate.instant('clinicalAttention.new.created'),
        this.translate.instant('clinicalAttention.close'),
        { duration: 3000 },
      );
      if (consultation) {
        await this.router.navigate(['/consultations', consultation.id]);
      }
    }
  }
}
