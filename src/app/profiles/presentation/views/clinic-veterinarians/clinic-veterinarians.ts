import { Component, computed, effect, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';
import { VeterinarianStore } from '../../../application/veterinarian.store';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays professional profiles registered in
 * the authenticated administrator's veterinary clinic.
 */
@Component({
  selector: 'app-clinic-veterinarians',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './clinic-veterinarians.html',
  styleUrl: './clinic-veterinarians.css',
})
export class ClinicVeterinarians {
  protected readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);
  protected readonly veterinarianStore = inject(VeterinarianStore);

  /**
   * Search text entered by the clinic administrator.
   */
  protected readonly searchTerm = signal('');

  /**
   * Identifier of the veterinarian whose details are displayed.
   */
  protected readonly selectedVeterinarianId = signal<number | null>(null);

  protected readonly clinic = this.clinicStore.clinic;
  protected readonly veterinarians = this.veterinarianStore.veterinarians;

  /**
   * Veterinarians filtered by name, specialty, license or email.
   */
  protected readonly filteredVeterinarians = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase();

    const veterinarians = this.veterinarians();

    if (!search) {
      return veterinarians;
    }

    return veterinarians.filter((veterinarian) => {
      const searchableText = [
        veterinarian.firstName,
        veterinarian.lastName,
        veterinarian.specialty,
        veterinarian.licenseNumber,
        veterinarian.email,
      ]
        .filter((value) => value != null)
        .join(' ')
        .toLocaleLowerCase();

      return searchableText.includes(search);
    });
  });

  /**
   * Selected veterinarian, retrieved from the current store results.
   */
  protected readonly selectedVeterinarian = computed(() => {
    const veterinarianId = this.selectedVeterinarianId();

    if (veterinarianId === null) {
      return null;
    }

    return this.veterinarians().find((veterinarian) => veterinarian.id === veterinarianId) ?? null;
  });

  constructor() {
    /**
     * Loads the institutional profile for the authenticated account.
     */
    effect(() => {
      const currentUser = this.iamStore.currentUser();

      if (currentUser && currentUser.hasRole('ROLE_CLINIC_ADMIN')) {
        this.clinicStore.loadByAccountId(currentUser.accountId);
      }
    });

    /**
     * Loads professional profiles after the clinic is identified.
     */
    effect(() => {
      const currentUser = this.iamStore.currentUser();
      const clinic = this.clinic();

      if (
        !currentUser ||
        !clinic ||
        !currentUser.hasRole('ROLE_CLINIC_ADMIN') ||
        clinic.accountId !== currentUser.accountId
      ) {
        return;
      }

      this.veterinarianStore.loadByClinicId(clinic.id);
    });
  }

  /**
   * Updates the search term.
   */
  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  /**
   * Displays the details of the selected veterinarian.
   */
  protected selectVeterinarian(veterinarianId: number): void {
    this.selectedVeterinarianId.set(veterinarianId);
  }

  /**
   * Closes the veterinarian detail panel.
   */
  protected closeDetails(): void {
    this.selectedVeterinarianId.set(null);
  }

  /**
   * Reloads the current clinic's professional directory.
   */
  protected refresh(): void {
    const clinic = this.clinic();
    const currentUser = this.iamStore.currentUser();

    if (
      !clinic ||
      !currentUser ||
      clinic.accountId !== currentUser.accountId ||
      !currentUser.hasRole('ROLE_CLINIC_ADMIN')
    ) {
      return;
    }

    this.veterinarianStore.loadByClinicId(clinic.id);
  }

  /**
   * Returns an abbreviation for profiles without a photograph.
   */
  protected initials(firstName: string, lastName: string): string {
    return (firstName.trim().charAt(0) + lastName.trim().charAt(0)).toUpperCase() || 'VT';
  }
}
