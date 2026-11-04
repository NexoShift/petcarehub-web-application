
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import type { CreatePetOwnerCommand } from '../../../domain/model/create-pet-owner.command';
import type { PersonSex } from '../../../domain/model/person-sex';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Allows a pet owner to complete their profile.
 */
@Component({
  selector: 'app-complete-pet-owner-profile',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './complete-pet-owner-profile.html',
  styleUrl: './complete-pet-owner-profile.css',
})
export class CompletePetOwnerProfile {
  private readonly iamStore = inject(IamStore);
  private readonly petOwnerStore = inject(PetOwnerStore);
  private readonly router = inject(Router);

  protected readonly currentUser = this.iamStore.currentUser;
  protected readonly loading = this.petOwnerStore.loading;
  protected readonly error = this.petOwnerStore.error;

  protected readonly selectedImage = signal<File | null>(null);
  protected readonly imageError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', Validators.maxLength(12)],
    sex: ['' as PersonSex | ''],
  });

  /**
   * Stores the selected profile image.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageError.set('Selecciona una imagen JPG, PNG o WebP.');
      this.selectedImage.set(null);
      input.value = '';
      return;
    }

    this.imageError.set(null);
    this.selectedImage.set(file);
  }

  /**
   * Creates the profile using the authenticated IAM account.
   */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loading()) return;

    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/sign-in']);
      return;
    }

    const values = this.form.getRawValue();

    const command: CreatePetOwnerCommand = {
      userId: user.id,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: user.email,
      phoneNumber: values.phoneNumber.trim() || null,
      sex: values.sex || null,
    };

    this.petOwnerStore.create(command, this.selectedImage()).subscribe({
      next: () => {
        this.router.navigate(['/profile/pet-owner']);
      },
      error: () => {
        // The store already provides an error message.
      },
    });
  }
}

