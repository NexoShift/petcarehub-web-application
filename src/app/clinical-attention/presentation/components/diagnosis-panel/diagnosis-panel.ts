import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { Diagnosis } from '../../../domain/model/diagnosis.entity';
import { DiagnosisForm, DiagnosisFormValue } from '../diagnosis-form/diagnosis-form';

export interface DiagnosisReevaluation {
  diagnosisId: number;
  value: DiagnosisFormValue;
}

/** Phase 5 (MW-25): diagnoses of the consultation. A diagnosis is never edited, only reevaluated. */
@Component({
  selector: 'app-diagnosis-panel',
  imports: [Icon, DatePipe, MatButtonModule, MatCardModule, TranslatePipe, DiagnosisForm],
  templateUrl: './diagnosis-panel.html',
  styleUrls: ['../../clinical-attention.css', './diagnosis-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  readonly registered = output<DiagnosisFormValue>();
  readonly reevaluated = output<DiagnosisReevaluation>();

  protected readonly reevaluating = signal<number | null>(null);

  constructor() {
    // A diagnosis was saved: close the reevaluation form
    effect(() => {
      this.consultation().diagnoses.length;
      untracked(() => this.reevaluating.set(null));
    });
  }

  protected toggleReevaluation(diagnosis: Diagnosis): void {
    this.reevaluating.update((current) => (current === diagnosis.id ? null : diagnosis.id));
  }

  protected reevaluate(diagnosis: Diagnosis, value: DiagnosisFormValue): void {
    this.reevaluated.emit({ diagnosisId: diagnosis.id, value });
  }
}
