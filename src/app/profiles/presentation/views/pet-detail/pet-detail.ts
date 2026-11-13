
import { Component, computed, effect, inject, signal, DestroyRef } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import { PetStore } from '../../../application/pet.store';
import { ClinicPatientStore } from '../../../application/clinic-patient.store';

import { PetForm } from '../../components/pet-form/pet-form';
import type { PetFormSubmission } from '../../components/pet-form/pet-form';

import type { UpdatePetCommand } from '../../../domain/model/update-pet.command';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays and manages a pet profile.
 */
@Component({
  selector: 'app-pet-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    PetForm,
    Icon,
  ],
  templateUrl: './pet-detail.html',
  styleUrl: './pet-detail.css',
})
export class PetDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly iamStore = inject(IamStore);
  protected readonly ownerStore = inject(PetOwnerStore);
  protected readonly petStore = inject(PetStore);
  protected readonly clinicPatientStore = inject(ClinicPatientStore);

  /** Clinics where this pet is registered as a patient. */
  protected readonly clinics = this.clinicPatientStore.clinics;

  protected readonly editing = signal(false);
  protected readonly uploadingImage = signal(false);
  protected readonly invalidId = signal(false);

  protected readonly pet = this.petStore.selectedPet;

  protected readonly canViewPet = computed(() => {
    const pet = this.pet();
    const owner = this.ownerStore.petOwner();

    return !!pet && !!owner && pet.ownerId === owner.id;
  });

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUser()?.id;

      if (userId != null) {
        this.ownerStore.loadByUserId(userId);
      }
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const petId = Number(params.get('petId'));

      this.editing.set(false);

      if (!Number.isSafeInteger(petId) || petId <= 0) {
        this.invalidId.set(true);
        return;
      }

      this.invalidId.set(false);
      this.petStore.loadById(petId);
      this.clinicPatientStore.loadClinicsByPetId(petId);
    });
  }

  /**
   * Enables pet information editing.
   */
  protected startEditing(): void {
    if (this.canViewPet()) {
      this.editing.set(true);
    }
  }

  /**
   * Saves the pet's updated profile information.
   */
  protected savePet(value: PetFormSubmission): void {
    const pet = this.pet();

    if (!pet || !this.canViewPet() || this.petStore.loading()) {
      return;
    }

    const command: UpdatePetCommand = {
      petId: pet.id,
      name: value.name,
      species: value.species,
      breed: value.breed,
      birthDate: value.birthDate,
      sex: value.sex,
    };

    this.petStore.update(command).subscribe({
      next: () => {
        this.editing.set(false);
        this.notify('profiles.pets.updated');
      },
      error: () => {
        this.notify('profiles.pets.updateError');
      },
    });
  }

  /**
   * Replaces the selected pet's profile image.
   */
  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];

    input.value = '';

    const pet = this.pet();

    if (!image || !pet || !this.canViewPet() || this.uploadingImage() || this.petStore.loading()) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(image.type)) {
      this.notify('profiles.pets.invalidImage');
      return;
    }

    this.uploadingImage.set(true);

    this.petStore.updateImage(pet.id, image).subscribe({
      next: () => {
        this.uploadingImage.set(false);
        this.notify('profiles.pets.imageUpdated');
      },
      error: () => {
        this.uploadingImage.set(false);
        this.notify('profiles.pets.imageError');
      },
    });
  }

  /**
   * Cancels profile editing.
   */
  protected cancelEditing(): void {
    this.editing.set(false);
  }

  /**
   * Displays a translated notification.
   */
  private notify(key: string): void {
    this.snackBar.open(this.translate.instant(key), this.translate.instant('profiles.pets.close'), {
      duration: 4000,
    });
  }
}

