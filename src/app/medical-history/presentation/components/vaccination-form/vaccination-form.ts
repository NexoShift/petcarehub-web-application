import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { MEDICAL_HISTORY_FIELD_LIMITS } from '../../../domain/model/medical-history-field-limits';
import { VaccinationInput } from '../../../domain/model/record-vaccination.command';

const today = () => new Date().toLocaleDateString('en-CA');

/** Registrar una vacuna aplicada (solo veterinario). */
@Component({
  selector: 'app-vaccination-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './vaccination-form.html',
  styleUrl: '../medical-history-forms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VaccinationForm {
  readonly saving = input(false);
  readonly submitted = output<VaccinationInput>();
  readonly cancelled = output<void>();

  protected readonly limits = MEDICAL_HISTORY_FIELD_LIMITS;
  protected readonly today = today();

  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly form = this.fb.group({
    vaccineName: ['', [Validators.required, Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.vaccineName)]],
    appliedOn: [today(), Validators.required],
    doseNumber: [null as number | null, [Validators.min(1), Validators.max(MEDICAL_HISTORY_FIELD_LIMITS.maxDoseNumber)]],
    nextDoseOn: [''],
    batchNumber: ['', Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.batchNumber)],
    notes: ['', Validators.maxLength(MEDICAL_HISTORY_FIELD_LIMITS.vaccinationNotes)],
  });

  protected get appliedInFuture(): boolean {
    return this.form.controls.appliedOn.value > this.today;
  }

  protected get nextNotAfterApplied(): boolean {
    const { appliedOn, nextDoseOn } = this.form.getRawValue();
    return !!nextDoseOn && !!appliedOn && nextDoseOn <= appliedOn;
  }

  protected submit(): void {
    if (this.form.invalid || this.appliedInFuture || this.nextNotAfterApplied || !this.form.getRawValue().vaccineName.trim()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ ...value, doseNumber: value.doseNumber === null ? null : Number(value.doseNumber) });
  }

  reset(): void {
    this.form.reset({ vaccineName: '', appliedOn: today(), doseNumber: null, nextDoseOn: '', batchNumber: '', notes: '' });
  }
}
