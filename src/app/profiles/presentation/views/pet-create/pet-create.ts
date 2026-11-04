
import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import { PetStore } from '../../../application/pet.store';

import { PetForm } from '../../components/pet-form/pet-form';
import type { PetFormSubmission } from '../../components/pet-form/pet-form';
import type { CreatePetCommand } from '../../../domain/model/create-pet.command';

/**
 * Provides the pet registration page.
 */
@Component({
  selector: 'app-pet-create',
  imports: [RouterLink, MatCardModule, TranslatePipe, PetForm],
  templateUrl: './pet-create.html',
  styleUrl: './pet-create.css',
})
export class PetCreate {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly iamStore = inject(IamStore);
  protected readonly ownerStore = inject(PetOwnerStore);
  protected readonly petStore = inject(PetStore);

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUser()?.id;

      if (userId != null) {
        this.ownerStore.loadByUserId(userId);
      }
    });
  }

  /**
   * Registers a pet belonging to the authenticated owner.
   */
  protected registerPet(value: PetFormSubmission): void {
    const ownerId = this.ownerStore.petOwner()?.id;

    if (ownerId == null || this.petStore.loading()) {
      return;
    }

    const command: CreatePetCommand = {
      ownerId,
      name: value.name,
      species: value.species,
      breed: value.breed,
      birthDate: value.birthDate,
      sex: value.sex,
    };

    this.petStore.create(command, value.image).subscribe({
      next: (pet) => {
        this.snackBar.open(
          this.translate.instant('profiles.pets.created'),
          this.translate.instant('profiles.pets.close'),
          { duration: 3500 },
        );

        void this.router.navigate(['/profiles/pets', pet.id]);
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('profiles.pets.createError'),
          this.translate.instant('profiles.pets.close'),
          { duration: 4500 },
        );
      },
    });
  }

  /**
   * Returns to the pet list.
   */
  protected cancel(): void {
    void this.router.navigate(['/profiles/pets']);
  }
}

