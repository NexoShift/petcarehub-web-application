import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';

import { ClinicForm, ClinicFormSubmission } from '../../components/clinic-form/clinic-form';

import type { UpdateClinicCommand } from '../../../domain/model/update-clinic.command';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays and manages the authenticated clinic's institutional profile.
 */
@Component({
  selector: 'app-clinic-profile',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ClinicForm,
    Icon,
  ],
  templateUrl: './clinic-profile.html',
  styleUrl: './clinic-profile.css',
})
export class ClinicProfile {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);

  protected readonly editing = signal(false);
  protected readonly uploadingImage = signal(false);

  protected readonly clinic = this.clinicStore.clinic;

  protected readonly initials = computed(() => {
    const name = this.clinic()?.name ?? '';

    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('') || 'PC'
    );
  });

  constructor() {
    effect(() => {
      const accountId = this.iamStore.currentUser()?.accountId;

      if (accountId != null) {
        this.clinicStore.loadByAccountId(accountId);
      }
    });
  }

  /**
   * Enables clinic profile editing.
   */
  protected startEditing(): void {
    if (this.clinic()) {
      this.editing.set(true);
    }
  }

  /**
   * Cancels clinic profile editing.
   */
  protected cancelEditing(): void {
    this.editing.set(false);
  }

  /**
   * Saves the updated institutional information.
   */
  protected saveClinic(value: ClinicFormSubmission): void {
    const clinic = this.clinic();

    if (!clinic || this.clinicStore.loading()) {
      return;
    }

    const command: UpdateClinicCommand = {
      clinicId: clinic.id,
      name: value.name,
      ruc: value.ruc,
      address: value.address,
      phoneNumber: value.phoneNumber,
      description: value.description,
    };

    this.clinicStore.update(command).subscribe({
      next: () => {
        this.editing.set(false);
        this.notify('profiles.clinic.updated');
      },
      error: () => {
        this.notify('profiles.clinic.updateError');
      },
    });
  }

  /**
   * Replaces the clinic profile image.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];

    input.value = '';

    const clinic = this.clinic();

    if (!image || !clinic || this.uploadingImage() || this.clinicStore.loading()) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(image.type) || image.size > 5 * 1024 * 1024) {
      this.notify('profiles.clinic.invalidImage');
      return;
    }

    this.uploadingImage.set(true);

    this.clinicStore.updateImage(clinic.id, image).subscribe({
      next: () => {
        this.uploadingImage.set(false);
        this.notify('profiles.clinic.imageUpdated');
      },
      error: () => {
        this.uploadingImage.set(false);
        this.notify('profiles.clinic.imageError');
      },
    });
  }

  private notify(key: string): void {
    this.snackBar.open(
      this.translate.instant(key),
      this.translate.instant('profiles.clinic.close'),
      { duration: 4000 },
    );
  }
}
