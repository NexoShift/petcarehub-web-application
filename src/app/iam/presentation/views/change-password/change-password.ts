import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';

/**
 * "Actualiza tu contraseña". Se abre en el primer ingreso de un veterinario que su clínica
 * registró con una contraseña temporal (mustChangePassword = true). Hasta cambiarla,
 * passwordChangeGuard no lo deja entrar al dashboard.
 */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './change-password.html',
  styleUrls: ['../auth-form.css', '../password-recovery/password-recovery.css', './change-password.css'],
})
export class ChangePassword {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly email = this.store.currentUser()?.email ?? '';
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  protected submit(): void {
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('auth.reset.mismatch');
      return;
    }
    if (newPassword === currentPassword) {
      this.errorMessage.set('auth.changePassword.samePassword');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.store.changePassword(currentPassword, newPassword).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: ApiError) => {
        // El backend responde 400 si la contraseña temporal no coincide
        this.errorMessage.set(e.status === 400 ? 'auth.changePassword.wrongCurrent' : e.message);
        this.loading.set(false);
      },
    });
  }

  protected signOut(): void {
    this.store.signOut();
    void this.router.navigate(['/sign-in']);
  }
}
