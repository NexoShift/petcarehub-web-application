import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import {
  INTERPRETATION_MAX_LENGTH,
  RegisterExamResultCommand,
  SUMMARY_MAX_LENGTH,
  VALUES_MAX_LENGTH,
} from '../../../domain/model/register-exam-result.command';

export interface ExamResultFormValue {
  summary: string;
  values: string;
  interpretation: string;
  resultDate: string;
}

@Component({
  selector: 'app-exam-result-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './exam-result-form.html',
  styleUrl: './exam-result-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamResultForm {
  readonly saving = input(false);
  readonly submitted = output<ExamResultFormValue>();

  protected readonly summaryMaxLength = SUMMARY_MAX_LENGTH;
  protected readonly valuesMaxLength = VALUES_MAX_LENGTH;
  protected readonly interpretationMaxLength = INTERPRETATION_MAX_LENGTH;
  protected readonly today = new Date();

  protected readonly form = inject(NonNullableFormBuilder).group({
    summary: ['', [Validators.required, Validators.maxLength(SUMMARY_MAX_LENGTH)]],
    values: ['', Validators.maxLength(VALUES_MAX_LENGTH)],
    interpretation: ['', Validators.maxLength(INTERPRETATION_MAX_LENGTH)],
    resultDate: [new Date(), Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      summary: value.summary,
      values: value.values,
      interpretation: value.interpretation,
      resultDate: RegisterExamResultCommand.toIsoDate(value.resultDate),
    });
  }
}
