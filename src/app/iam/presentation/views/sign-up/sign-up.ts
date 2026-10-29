import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';
import { AccountType } from '../../../domain/model/account-type';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout],
  templateUrl: './sign-up.html',
  styleUrls: ['../auth-form.css', './sign-up.css'],
})
export class SignUp {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly accountTypes = [
    { value: 'PET_OWNER' as AccountType, tag: 'Tutor', label: 'Dueño de Mascota',
      description: 'Accede al historial de tus mascotas y resúmenes con IA.' },
    { value: 'CLINIC' as AccountType, tag: 'Clínico', label: 'Médico Veterinario',
      description: 'Registra consultas, prescribe y utiliza asistencia diagnóstica.' },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    accountType: ['PET_OWNER' as AccountType, Validators.required],
    // fullName y phone todavía no van a IAM: se enviarán a Profiles en el paso 2 (Parte 2)
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    // Mismas reglas que SignUpResource en el backend: entre 8 y 72 caracteres
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    acceptTerms: [false, Validators.requiredTrue],
  });

  /** Fuerza de la contraseña de 0 a 4, para las 4 barras del diseño. */
  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly strength = computed(() => {
    const p = this.password();
    if (!p) return 0;
    return [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)]
      .filter(Boolean).length;
  });
  protected readonly strengthLabel = computed(() => ['', 'Débil', 'Media', 'Buena', 'Fuerte'][this.strength()]);

  protected selectAccountType(type: AccountType): void {
    this.form.controls.accountType.setValue(type);
  }

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
    const { email, password, accountType } = this.form.getRawValue();

    this.store.signUp(email, password, accountType).subscribe({
      next: () => this.router.navigate(['/sign-in'], { queryParams: { registered: true } }),
      error: (e: ApiError) => {
        this.errorMessage.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
