import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';

export interface AnamnesisFormValue {
  chiefComplaint: string;
  evolutionTime: string;
  symptoms: string[];
  diet: string;
  behavior: string;
  previousTreatments: string;
  ownerObservations: string;
}

const notBlank = Validators.pattern(/\S/);

/** Phase 1 (MW-23): interview with the owner. It is registered once and never overwritten. */
@Component({
  selector: 'app-anamnesis-panel',
  imports: [
    Icon,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './anamnesis-panel.html',
  styleUrls: ['../../clinical-attention.css', './anamnesis-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnamnesisPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  readonly submitted = output<AnamnesisFormValue>();

  private readonly translate = inject(TranslateService);

  protected readonly limits = CLINICAL_FIELD_LIMITS;
  protected readonly evolutionOptions = ['acute', 'days', 'week', 'month', 'chronic'];
  protected readonly symptomSuggestions = [
    'vomiting',
    'diarrhea',
    'fever',
    'cough',
    'lethargy',
    'appetiteLoss',
    'limping',
    'itching',
  ];

  protected readonly symptoms = signal<string[]>([]);
  protected readonly symptomDraft = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(CLINICAL_FIELD_LIMITS.symptom)],
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    chiefComplaint: [
      '',
      [Validators.required, notBlank, Validators.maxLength(CLINICAL_FIELD_LIMITS.chiefComplaint)],
    ],
    evolutionTime: [
      '',
      [Validators.required, notBlank, Validators.maxLength(CLINICAL_FIELD_LIMITS.evolutionTime)],
    ],
    diet: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.diet)],
    behavior: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.behavior)],
    previousTreatments: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.previousTreatments)],
    ownerObservations: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.ownerObservations)],
  });

  protected useEvolution(option: string): void {
    const control = this.form.controls.evolutionTime;
    control.setValue(
      this.translate.instant('clinicalAttention.anamnesis.evolutionOptions.' + option),
    );
    control.markAsDirty();
  }

  protected addSymptom(value = this.symptomDraft.value): void {
    const symptom = value.trim();
    const repeated = this.symptoms().some((item) => item.toLowerCase() === symptom.toLowerCase());
    const full = this.symptoms().length >= CLINICAL_FIELD_LIMITS.maxSymptoms;
    if (symptom === '' || symptom.length > CLINICAL_FIELD_LIMITS.symptom || repeated || full) {
      this.symptomDraft.markAsTouched();
      return;
    }
    this.symptoms.update((symptoms) => [...symptoms, symptom]);
    this.symptomDraft.reset('');
  }

  protected suggest(key: string): void {
    this.addSymptom(this.translate.instant('clinicalAttention.anamnesis.suggestions.' + key));
  }

  protected removeSymptom(symptom: string): void {
    this.symptoms.update((symptoms) => symptoms.filter((item) => item !== symptom));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit({ ...this.form.getRawValue(), symptoms: this.symptoms() });
  }
}
