import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { CLINICAL_FIELD_LIMITS } from '../../../domain/model/clinical-field-limits';

@Component({
  selector: 'app-cancel-consultation-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './cancel-consultation-dialog.html',
  styleUrl: './cancel-consultation-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelConsultationDialog {
  private readonly dialogRef = inject(MatDialogRef<CancelConsultationDialog, string>);

  protected readonly maxLength = CLINICAL_FIELD_LIMITS.cancellationReason;
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(this.maxLength),
    ],
  });

  protected confirm(): void {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(this.reason.value);
  }
}
