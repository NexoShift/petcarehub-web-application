import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { DiagnosisType } from '../../../domain/enums/diagnosis-type.enum';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';
import { Diagnosis } from '../../../domain/model/diagnosis.entity';

export interface DiagnosisFormValue {
  description: string;
  type: DiagnosisType | null;
  primary: boolean;
  differentialDiagnoses: string[];
  rationale: string;
}

/**
 * Registers a diagnosis or, with mode "reevaluate", replaces a current one. A reevaluation inherits
 * `primary` from the diagnosis it replaces, so the switch is only shown when registering.
 */
@Component({
  selector: 'app-diagnosis-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslatePipe,
  ],
  templateUrl: './diagnosis-form.html',
  styleUrls: ['../../clinical-attention.css', './diagnosis-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisForm {
  readonly mode = input<'register' | 'reevaluate'>('register');
  /** A consultation has one current primary diagnosis; when it exists the switch is disabled. */
  readonly canBePrimary = input(true);
  /** The diagnosis being reevaluated; its data fills the form. */
  readonly initial = input<Diagnosis | null>(null);
  readonly saving = input(false);
  /** Changing this value clears the form, e.g. after the diagnosis was saved. */
  readonly resetKey = input(0);
  readonly submitted = output<DiagnosisFormValue>();
  readonly cancelled = output<void>();

  protected readonly limits = CLINICAL_FIELD_LIMITS;
  protected readonly types = Object.values(DiagnosisType);
  protected readonly idPrefix = computed(() =>
    this.mode() === 'register' ? 'diagnosis' : 'reevaluation',
  );

  protected readonly differentials = signal<string[]>([]);
  protected readonly differentialDraft = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(CLINICAL_FIELD_LIMITS.differentialDiagnosis)],
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    description: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(CLINICAL_FIELD_LIMITS.diagnosisDescription),
      ],
    ],
    type: [null as DiagnosisType | null, Validators.required],
    primary: [false],
    rationale: ['', Validators.maxLength(CLINICAL_FIELD_LIMITS.rationale)],
  });

  constructor() {
    effect(() => {
      const initial = this.initial();
      this.resetKey();
      untracked(() => {
        this.form.reset({
          description: initial?.description ?? '',
          type: initial?.type ?? null,
          primary: false,
          rationale: initial?.rationale ?? '',
        });
        this.differentials.set([...(initial?.differentialDiagnoses ?? [])]);
      });
    });
    effect(() => {
      const primary = this.form.controls.primary;
      if (this.canBePrimary() && this.mode() === 'register') {
        primary.enable({ emitEvent: false });
      } else {
        primary.disable({ emitEvent: false });
        primary.setValue(false, { emitEvent: false });
      }
    });
  }

  protected addDifferential(): void {
    const value = this.differentialDraft.value.trim();
    const repeated = this.differentials().some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    const full = this.differentials().length >= CLINICAL_FIELD_LIMITS.maxDifferentialDiagnoses;
    if (
      value === '' ||
      value.length > CLINICAL_FIELD_LIMITS.differentialDiagnosis ||
      repeated ||
      full
    ) {
      this.differentialDraft.markAsTouched();
      return;
    }
    this.differentials.update((items) => [...items, value]);
    this.differentialDraft.reset('');
  }

  protected removeDifferential(item: string): void {
    this.differentials.update((items) => items.filter((current) => current !== item));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      description: value.description,
      type: value.type,
      primary: value.primary,
      differentialDiagnoses: this.differentials(),
      rationale: value.rationale,
    });
  }
}
