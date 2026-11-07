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
import { BodySystem } from '../../../domain/enums/body-system.enum';
import { FindingSeverity } from '../../../domain/enums/finding-severity.enum';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';

export interface FindingFormValue {
  bodySystem: BodySystem | null;
  description: string;
  severity: FindingSeverity | null;
}

/** Phase 2 (MW-24): findings by body system. */
@Component({
  selector: 'app-findings-panel',
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
  templateUrl: './findings-panel.html',
  styleUrl: '../../clinical-attention.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindingsPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  readonly submitted = output<FindingFormValue>();

  protected readonly maxLength = CLINICAL_FIELD_LIMITS.findingDescription;
  protected readonly bodySystems = Object.values(BodySystem);
  protected readonly severities = Object.values(FindingSeverity);

  protected readonly form = inject(NonNullableFormBuilder).group({
    bodySystem: [null as BodySystem | null, Validators.required],
    description: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(this.maxLength)],
    ],
    severity: [null as FindingSeverity | null],
  });

  constructor() {
    // A finding was saved: clear the form for the next one
    effect(() => {
      this.consultation().findings.length;
      untracked(() => this.form.reset());
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
