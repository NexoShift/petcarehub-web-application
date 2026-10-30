import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { REASON_MAX_LENGTH } from '../../../domain/model/cancel-clinical-exam.command';

@Component({
  selector: 'app-cancel-exam-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './cancel-exam-dialog.html',
  styleUrl: './cancel-exam-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelExamDialog {
  private readonly dialogRef = inject(MatDialogRef<CancelExamDialog, string>);

  protected readonly maxLength = REASON_MAX_LENGTH;
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(REASON_MAX_LENGTH),
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
