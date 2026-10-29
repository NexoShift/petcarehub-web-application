import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';

/** MW-03 · Recuperación de contraseña. */
@Component({
  selector: 'app-password-recovery',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './password-recovery.html',
  styleUrls: ['../auth-form.css', './password-recovery.css'],
})
export class PasswordRecovery {
  private readonly store = inject(IamStore);

  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.store.requestPasswordRecovery(this.form.getRawValue().email).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.errorMessage.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
