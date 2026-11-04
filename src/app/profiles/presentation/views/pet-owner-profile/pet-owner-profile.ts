
import {
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import { PetStore } from '../../../application/pet.store';

import type { PersonSex } from '../../../domain/model/person-sex';
import type { UpdatePetOwnerCommand } from '../../../domain/model/update-pet-owner.command';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays and manages the authenticated pet owner's profile.
 */
@Component({
  selector: 'app-pet-owner-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    Icon
  ],
  templateUrl: './pet-owner-profile.html',
  styleUrl: './pet-owner-profile.css'
})
export class PetOwnerProfile {

  protected readonly iamStore = inject(IamStore);
  protected readonly petOwnerStore = inject(PetOwnerStore);
  protected readonly petStore = inject(PetStore);

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly editing = signal(false);
  protected readonly uploadingImage = signal(false);

  protected readonly owner = this.petOwnerStore.petOwner;

  protected readonly fullName = computed(() => {
    const owner = this.owner();

    return owner
      ? `${owner.firstName} ${owner.lastName}`.trim()
      : '';
  });

  protected readonly initials = computed(() => {
    const owner = this.owner();

    if (!owner) {
      return 'PC';
    }

    return `${owner.firstName.charAt(0)}${owner.lastName.charAt(0)}`
      .toUpperCase();
  });

  protected readonly petsPreview = computed(() =>
    this.petStore.pets().slice(0, 3)
  );

  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+()\s-]{7,20}$/)]],
    sex: ['' as '' | PersonSex]
  });

  constructor() {
    // Load the current user's profile after IAM restores the session.
    effect(() => {
      const userId = this.iamStore.currentUser()?.id;

      if (userId != null) {
        this.petOwnerStore.loadByUserId(userId);
      }
    });

    // Synchronize the form with the loaded profile.
    effect(() => {
      const owner = this.owner();

      if (!owner || this.editing()) {
        return;
      }

      this.profileForm.patchValue({
        firstName: owner.firstName,
        lastName: owner.lastName,
        phoneNumber: owner.phoneNumber ?? '',
        sex: owner.sex ?? ''
      }, { emitEvent: false });
    });

    // Load pets when the owner's profile becomes available.
    effect(() => {
      const ownerId = this.owner()?.id;

      if (ownerId != null) {
        this.petStore.loadByOwnerId(ownerId);
      }
    });
  }

  /**
   * Enables personal information editing.
   */
  protected startEditing(): void {
    this.editing.set(true);
  }

  /**
   * Discards pending form changes.
   */
  protected cancelEditing(): void {
    const owner = this.owner();

    if (owner) {
      this.profileForm.reset({
        firstName: owner.firstName,
        lastName: owner.lastName,
        phoneNumber: owner.phoneNumber ?? '',
        sex: owner.sex ?? ''
      });
    }

    this.editing.set(false);
  }

  /**
   * Saves the updated personal information.
   */
  protected saveProfile(): void {
    const owner = this.owner();

    if (!owner || this.profileForm.invalid ||
      this.petOwnerStore.loading()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.getRawValue();

    const command: UpdatePetOwnerCommand = {
      petOwnerId: owner.id,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phoneNumber: values.phoneNumber.trim() || null,
      sex: values.sex === '' ? null : values.sex
    };

    this.petOwnerStore.update(command).subscribe({
      next: () => {
        this.editing.set(false);
        this.showMessage('profiles.owner.saved');
      },
      error: () => {
        this.showMessage('profiles.owner.saveError');
      }
    });
  }

  /**
   * Uploads a new profile image selected by the user.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];

    if (!image) {
      return;
    }

    input.value = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(image.type)) {
      this.showMessage('profiles.owner.invalidImage');
      return;
    }

    const owner = this.owner();

    if (!owner || this.uploadingImage()) {
      return;
    }

    this.uploadingImage.set(true);

    this.petOwnerStore.updateImage(owner.id, image).subscribe({
      next: () => {
        this.uploadingImage.set(false);
        this.showMessage('profiles.owner.imageSaved');
      },
      error: (_error: HttpErrorResponse) => {
        this.uploadingImage.set(false);
        this.showMessage('profiles.owner.imageError');
      }
    });
  }

  /**
   * Shows a translated notification.
   */
  private showMessage(translationKey: string): void {
    this.snackBar.open(
      this.translate.instant(translationKey),
      this.translate.instant('profiles.owner.close'),
      { duration: 4000 }
    );
  }
}
