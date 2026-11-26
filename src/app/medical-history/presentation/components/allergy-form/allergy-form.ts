import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { AllergySeverity } from '../../../domain/enums/allergy-severity.enum';
import { MEDICAL_HISTORY_FIELD_LIMITS } from '../../../domain/model/medical-history-field-limits';
import { AllergyInput } from '../../../domain/model/record-allergy.command';

/** Registrar una alergia (dueño o veterinario). */
@Component({
  selector: 'app-allergy-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './allergy-form.html',
  styleUrl: '../medical-history-forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllergyForm {
  readonly saving = input(false);
  readonly submitted = output<AllergyInput>();
  readonly cancelled = output<void>();

  protected readonly limits = MEDICAL_HISTORY_FIELD_LIMITS;
  protected readonly severities = Object.values(AllergySeverity);

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly form = this.fb.group({
    allergen: ['', [Validators.required, Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.allergen)]],
    reaction: ['', Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.reaction)],
    severity: [null as AllergySeverity | null, Validators.required],
    notes: ['', Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.allergyNotes)],
  });

  protected pick(severity: AllergySeverity): void {
    this.form.controls.severity.setValue(severity);
    this.form.controls.severity.markAsTouched();
  }

  protected submit(): void {
    if (this.form.invalid || !this.form.getRawValue().allergen.trim()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }

  /** El padre la llama cuando la API confirmó el registro. */
  reset(): void {
    this.form.reset({ allergen: '', reaction: '', severity: null, notes: '' });
  }
}
