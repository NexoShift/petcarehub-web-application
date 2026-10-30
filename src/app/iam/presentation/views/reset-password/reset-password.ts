import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';

/** MW-03 · Cambio de contraseña. Se abre desde el enlace del correo: /reset-password?token=... */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './reset-password.html',
  styleUrls: ['../auth-form.css', '../password-recovery/password-recovery.css'],
})
export class ResetPassword {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  protected submit(): void {
    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('auth.reset.mismatch');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.store.resetPassword(this.token, newPassword).subscribe({
      next: () => this.router.navigate(['/sign-in'], { queryParams: { passwordChanged: true } }),
      error: (e: ApiError) => {
        this.errorMessage.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
