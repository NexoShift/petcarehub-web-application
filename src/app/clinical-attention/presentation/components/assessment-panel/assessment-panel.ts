import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { HydrationStatus } from '../../../domain/enums/hydration-status.enum';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import {
  CLINICAL_FIELD_LIMITS,
  VITAL_SIGN_LIMITS,
} from '../../../domain/model/clinical-field-limits';

export interface AssessmentFormValue {
  weightKg: number | null;
  temperatureCelsius: number | null;
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  bodyConditionScore: number | null;
  hydrationStatus: HydrationStatus | null;
  mucousMembranes: string;
  capillaryRefillTimeSeconds: number | null;
  observations: string;
}

/** Phase 2 (MW-24): vital signs. Every measurement is added; none replaces a previous one. */
@Component({
  selector: 'app-assessment-panel',
  imports: [
    Icon,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './assessment-panel.html',
  styleUrls: ['../../clinical-attention.css', './assessment-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  readonly submitted = output<AssessmentFormValue>();

  protected readonly limits = CLINICAL_FIELD_LIMITS;
  protected readonly vitals = VITAL_SIGN_LIMITS;
  protected readonly hydrationStatuses = Object.values(HydrationStatus);
  protected readonly bodyConditionScores = Array.from({ length: 9 }, (_, index) => index + 1);

  protected readonly form = inject(NonNullableFormBuilder).group({
    weightKg: [
      null as number | null,
      [Validators.required, Validators.min(0.01), Validators.max(VITAL_SIGN_LIMITS.weightKg.max)],
    ],
    temperatureCelsius: [
      null as number | null,
      [
        Validators.required,
        Validators.min(VITAL_SIGN_LIMITS.temperatureCelsius.min),
        Validators.max(VITAL_SIGN_LIMITS.temperatureCelsius.max),
      ],
    ],
    heartRateBpm: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(VITAL_SIGN_LIMITS.heartRateBpm.max),
        Validators.pattern(/^\d+$/),
      ],
    ],
    respiratoryRateBpm: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(VITAL_SIGN_LIMITS.respiratoryRateBpm.max),
        Validators.pattern(/^\d+$/),
      ],
    ],
    bodyConditionScore: [null as number | null],
    hydrationStatus: [null as HydrationStatus | null],
    mucousMembranes: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.mucousMembranes)],
    capillaryRefillTimeSeconds: [null as number | null, Validators.min(0.1)],
    observations: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.assessmentObservations)],
  });

  constructor() {
    // A new measurement was saved: leave the form ready for the next one
    effect(() => {
      this.consultation().physiologicalAssessments.length;
      untracked(() => this.form.reset());
    });
  }

  /** Newest first. */
  protected recorded() {
    return [...this.consultation().physiologicalAssessments].reverse();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
