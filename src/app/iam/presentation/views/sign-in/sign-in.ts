import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

/**
 * MW-01 · Inicio de sesión. No hay pestañas Dueño/Veterinario: el rol llega en la respuesta
 * del backend y la ruta /home abre el panel que corresponde (ver dashboard.routes.ts).
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, TranslatePipe],
  templateUrl: './sign-in.html',
  styleUrl: '../auth-form.css',
})
export class SignIn {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  /** true cuando venimos de crear la cuenta (sign-up redirige con ?registered=true). */
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;
  protected readonly justRegistered = this.query.has('registered');
  protected readonly passwordChanged = this.query.has('passwordChanged');
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  /** Clave de traducción (ej. 'auth.signIn.wrongCredentials') o el mensaje que mandó el backend. */
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected togglePassword(): void {
    this.showPassword.update(visible => !visible);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();

    this.store.signIn(email, password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: ApiError) => {
        this.errorMessage.set(e.status === 401 ? 'auth.signIn.wrongCredentials' : e.message);
        this.loading.set(false);
      },
    });
  }
}
