
import { Component, inject, input, output, signal } from '@angular/core';

import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';

import type { User } from '../../../domain/model/user.entity';
import type { CreateMemberUserCommand } from '../../../domain/model/create-member-user.command';

/**
 * Reusable component for registering veterinarian members
 * within an existing clinic IAM account.
 *
 * The parent component provides the account identifier
 * and handles navigation or UI updates after registration.
 */
@Component({
  selector: 'app-create-clinic-member',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconButton,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './create-clinic-member.html',
  styleUrl: './create-clinic-member.css',
})
export class CreateClinicMember {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly iamStore = inject(IamStore);

  /**
   * Identifier of the clinic IAM account.
   */
  readonly accountId = input.required<number>();

  /**
   * Emitted after a member account is created successfully.
   */
  readonly memberCreated = output<User>();

  /**
   * Emitted when the registration form is cancelled.
   */
  readonly cancelled = output<void>();

  /**
   * Indicates whether the registration request is running.
   */
  protected readonly saving = signal(false);

  /**
   * Controls password visibility.
   */
  protected readonly showPassword = signal(false);

  /**
   * Translation key for the current registration error.
   */
  protected readonly errorKey = signal<string | null>(null);

  /**
   * Reactive form for the new member's credentials.
   */
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  /**
   * Toggles visibility of the initial password.
   */
  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  /**
   * Creates a veterinarian member through IAM.
   */
  protected submit(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const accountId = this.accountId();

    if (!Number.isInteger(accountId) || accountId <= 0) {
      this.errorKey.set('profiles.clinicMembers.invalidAccount');
      return;
    }

    const { email, password } = this.form.getRawValue();

    const command: CreateMemberUserCommand = {
      accountId,
      email: email.trim(),
      password,
    };

    this.saving.set(true);
    this.errorKey.set(null);

    this.iamStore.createMember(command).subscribe({
      next: (user: User) => {
        this.saving.set(false);
        this.form.reset();
        this.showPassword.set(false);

        this.memberCreated.emit(user);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.handleError(error);
      },
    });
  }

  /**
   * Notifies the parent component about cancellation.
   */
  protected cancel(): void {
    if (this.saving()) {
      return;
    }

    this.cancelled.emit();
  }

  /**
   * Maps HTTP errors to localized messages.
   */
  private handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorKey.set('profiles.clinicMembers.createError');
      return;
    }

    switch (error.status) {
      case 400:
        this.errorKey.set('profiles.clinicMembers.invalidData');
        break;

      case 401:
      case 403:
        this.errorKey.set('profiles.clinicMembers.notAuthorized');
        break;

      case 409:
        this.errorKey.set('profiles.clinicMembers.emailExists');
        break;

      default:
        this.errorKey.set('profiles.clinicMembers.createError');
        break;
    }
  }
}

