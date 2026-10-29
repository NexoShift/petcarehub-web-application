import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam-store';
import { AccountType } from '../../../domain/model/account-type';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-up',
  styleUrl: '../sign-in/sign-in.css',
  templateUrl: './sign-up.html',
})
export class SignUp {
  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'PET_OWNER', label: 'Dueño de mascota' },
    { value: 'CLINIC', label: 'Clínica o veterinario' },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    // Mismas reglas que SignUpResource en el backend: entre 8 y 72 caracteres
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    accountType: ['PET_OWNER' as AccountType, Validators.required],
  });

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
