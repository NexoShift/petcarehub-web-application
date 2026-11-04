
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { PetOwnerStore } from '../../../application/pet-owner.store';
import { PetStore } from '../../../application/pet.store';

import { PetCard } from '../../components/pet-card/pet-card';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays the authenticated owner's registered pets.
 */
@Component({
  selector: 'app-pet-list',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, TranslatePipe, PetCard, Icon],
  templateUrl: './pet-list.html',
  styleUrl: './pet-list.css',
})
export class PetList {
  protected readonly iamStore = inject(IamStore);
  protected readonly ownerStore = inject(PetOwnerStore);
  protected readonly petStore = inject(PetStore);

  private readonly loadedOwnerId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUser()?.id;

      if (userId != null) {
        this.ownerStore.loadByUserId(userId);
      }
    });

    effect(() => {
      const ownerId = this.ownerStore.petOwner()?.id;

      if (ownerId == null || this.loadedOwnerId() === ownerId) {
        return;
      }

      this.loadedOwnerId.set(ownerId);
      this.petStore.loadByOwnerId(ownerId);
    });
  }

  /**
   * Reloads the current owner's pets.
   */
  protected reload(): void {
    const ownerId = this.ownerStore.petOwner()?.id;

    if (ownerId != null) {
      this.petStore.loadByOwnerId(ownerId);
    }
  }
}

