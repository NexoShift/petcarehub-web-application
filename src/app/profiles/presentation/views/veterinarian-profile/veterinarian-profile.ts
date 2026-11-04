
import { Component, effect, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { VeterinarianStore } from '../../../application/veterinarian.store';

import type { UpdateVeterinarianCommand } from '../../../domain/model/update-veterinarian.command';

import {
  VeterinarianProfileForm,
  type VeterinarianProfileFormSubmission,
} from '../../components/veterinarian-profile-form/veterinarian-profile-form';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays and manages the authenticated veterinarian's
 * personal and professional profile.
 */
@Component({
  selector: 'app-veterinarian-profile',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    VeterinarianProfileForm,
    Icon,
  ],
  templateUrl: './veterinarian-profile.html',
  styleUrl: './veterinarian-profile.css',
})
export class VeterinarianProfile {
  protected readonly iamStore = inject(IamStore);
  protected readonly veterinarianStore = inject(VeterinarianStore);

  protected readonly veterinarian = this.veterinarianStore.veterinarian;
  protected readonly loading = this.veterinarianStore.loading;
  protected readonly error = this.veterinarianStore.error;
  protected readonly profileNotFound = this.veterinarianStore.profileNotFound;

  /**
   * Indicates whether the professional information form is visible.
   */
  protected readonly editing = signal(false);

  /**
   * Indicates whether a profile update is in progress.
   */
  protected readonly saving = signal(false);

  /**
   * Indicates whether an image update is in progress.
   */
  protected readonly uploadingImage = signal(false);

  /**
   * Success and error messages displayed in the view.
   */
  protected readonly feedback = signal<string | null>(null);
  protected readonly operationError = signal<string | null>(null);
  protected readonly invalidImage = signal(false);

  constructor() {
    /**
     * Retrieves the profile associated with the authenticated
     * IAM veterinarian user.
     */
    effect(() => {
      const currentUser = this.iamStore.currentUser();

      if (!currentUser || !currentUser.hasRole('ROLE_VETERINARIAN')) {
        return;
      }

      this.veterinarianStore.loadByUserId(currentUser.id);
    });
  }

  /**
   * Displays the existing profile form in edit mode.
   */
  protected startEditing(): void {
    if (!this.veterinarian()) {
      return;
    }

    this.feedback.set(null);
    this.operationError.set(null);
    this.editing.set(true);
  }

  /**
   * Returns to the profile summary.
   */
  protected cancelEditing(): void {
    if (this.saving()) {
      return;
    }

    this.editing.set(false);
    this.operationError.set(null);
  }

  /**
   * Updates the authenticated veterinarian's professional information.
   *
   * @param values validated form values.
   */
  protected saveProfile(values: VeterinarianProfileFormSubmission): void {
    const profile = this.veterinarian();

    if (!profile || this.saving()) {
      return;
    }

    const command: UpdateVeterinarianCommand = {
      veterinarianId: profile.id,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phoneNumber,
      sex: values.sex,
      licenseNumber: values.licenseNumber,
      specialty: values.specialty,
    };

    this.saving.set(true);
    this.feedback.set(null);
    this.operationError.set(null);

    this.veterinarianStore.update(command).subscribe({
      next: () => {
        this.editing.set(false);
        this.feedback.set('updated');
        this.saving.set(false);
      },
      error: () => {
        this.operationError.set('updateError');
        this.saving.set(false);
      },
    });
  }

  /**
   * Validates and uploads a replacement profile photograph.
   *
   * @param event the file input change event.
   */
  protected changeImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const profile = this.veterinarian();

    input.value = '';

    if (!file || !profile || this.uploadingImage()) {
      return;
    }

    this.invalidImage.set(false);
    this.feedback.set(null);
    this.operationError.set(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const maximumSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) || file.size > maximumSize) {
      this.invalidImage.set(true);
      return;
    }

    this.uploadingImage.set(true);

    this.veterinarianStore.updateImage(profile.id, file).subscribe({
      next: () => {
        this.feedback.set('imageUpdated');
        this.uploadingImage.set(false);
      },
      error: () => {
        this.operationError.set('imageError');
        this.uploadingImage.set(false);
      },
    });
  }

  /**
   * Reloads the authenticated user's profile.
   */
  protected refresh(): void {
    const currentUser = this.iamStore.currentUser();

    if (
      !currentUser ||
      !currentUser.hasRole('ROLE_VETERINARIAN') ||
      this.saving() ||
      this.uploadingImage()
    ) {
      return;
    }

    this.feedback.set(null);
    this.operationError.set(null);
    this.invalidImage.set(false);
    this.veterinarianStore.loadByUserId(currentUser.id);
  }

  /**
   * Returns the veterinarian initials for profiles
   * without a photograph.
   */
  protected initials(firstName: string, lastName: string): string {
    return (firstName.trim().charAt(0) + lastName.trim().charAt(0)).toUpperCase() || 'VT';
  }
}

