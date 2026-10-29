import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validator, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam-store';


@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-sign-in',
  styleUrl: './sign-in.css',
  templateUrl: './sign-in.html',
})
export class SignIn {

  private readonly store = inject(IamStore);
  private readonly router = inject(Router);

  /**
   * True cuando entramos a crear la cuenta (sign-up redirige con : registered= true
   */
  protected readonly justRegistered =
    inject(ActivatedRoute).snapshot.queryParamMap.has('registered');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],

  });

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
      error: (e :ApiError) => {
        this.errorMessage.set(e.status === 401 ? 'Correo o Contraseña Incorrectos' : e.message);
        this.loading.set(false);
      },
    });

  }


}
