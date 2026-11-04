
import { Component, effect, inject, input, output, signal } from '@angular/core';

import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { Veterinarian } from '../../../domain/model/veterinarian.entity';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Editable information supported by the veterinarian
 * profile creation and update operations.
 */
export interface VeterinarianProfileFormSubmission {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  sex: 'MALE' | 'FEMALE' | null;
  licenseNumber: string | null;
  specialty: string | null;
  image: File | null;
}

/**
 * Reusable form for veterinarian profile creation and editing.
 *
 * The parent component provides the IAM email and handles
 * the creation or update command.
 */
@Component({
  selector: 'app-veterinarian-profile-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './veterinarian-profile-form.html',
  styleUrl: './veterinarian-profile-form.css',
})
export class VeterinarianProfileForm {
  private readonly fb = inject(NonNullableFormBuilder);

  /**
   * Existing veterinarian profile.
   * A null value indicates creation mode.
   */
  readonly veterinarian = input<Veterinarian | null>(null);

  /**
   * Email associated with the IAM user.
   */
  readonly email = input('');

  /**
   * Indicates that a create or update request is running.
   */
  readonly saving = input(false);

  /**
   * Emits validated professional information.
   */
  readonly submitted = output<VeterinarianProfileFormSubmission>();

  /**
   * Notifies the parent when the form is cancelled.
   */
  readonly cancelled = output<void>();

  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imageError = signal(false);

  /**
   * Form controls for personal and professional information.
   */
  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: [''],
    sex: [''],
    licenseNumber: [''],
    specialty: [''],
  });

  constructor() {
    effect(() => {
      const profile = this.veterinarian();

      if (!profile) {
        this.form.reset();
        this.selectedImage.set(null);
        return;
      }

      this.form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber ?? '',
        sex: profile.sex ?? '',
        licenseNumber: profile.licenseNumber ?? '',
        specialty: profile.specialty ?? '',
      });

      this.selectedImage.set(null);
    });
  }

  /**
   * Validates an optional profile image during registration.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.imageError.set(false);
    this.selectedImage.set(null);

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const maximumSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) || file.size > maximumSize) {
      this.imageError.set(true);
      input.value = '';
      return;
    }

    this.selectedImage.set(file);
  }

  /**
   * Emits the validated form values.
   */
  protected submit(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const firstName = value.firstName.trim();
    const lastName = value.lastName.trim();

    if (!firstName) {
      this.form.controls.firstName.setErrors({ required: true });
    }

    if (!lastName) {
      this.form.controls.lastName.setErrors({ required: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const optional = (text: string): string | null => text.trim() || null;

    const sex: 'MALE' | 'FEMALE' | null =
      value.sex === 'MALE' || value.sex === 'FEMALE' ? value.sex : null;

    this.submitted.emit({
      firstName,
      lastName,
      phoneNumber: optional(value.phoneNumber),
      sex,
      licenseNumber: optional(value.licenseNumber),
      specialty: optional(value.specialty),
      image: this.veterinarian() ? null : this.selectedImage(),
    });
  }
}

