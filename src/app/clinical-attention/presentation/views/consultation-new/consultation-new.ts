import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';
import { CreateClinicalConsultationCommand } from '../../../domain/model/create-clinical-consultation.command';

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
    TranslatePipe,
  ],
  templateUrl: './consultation-new.html',
  styleUrl: '../../clinical-attention.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationNew implements OnInit {
  /** Bound from the `petId` query parameter to prefill the form. */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly reasonMaxLength = CLINICAL_FIELD_LIMITS.reason;

  protected readonly form = inject(NonNullableFormBuilder).group({
    petId: [null as number | null, [Validators.required, Validators.min(1)]],
    clinicId: [null as number | null, [Validators.required, Validators.min(1)]],
    consultingRoomId: [null as number | null, Validators.min(1)],
    reason: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(this.reasonMaxLength)],
    ],
  });

  ngOnInit(): void {
    this.store.clearError();
    const petId = Number(this.petId());
    if (Number.isInteger(petId) && petId > 0) {
      this.form.controls.petId.setValue(petId);
    }
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
