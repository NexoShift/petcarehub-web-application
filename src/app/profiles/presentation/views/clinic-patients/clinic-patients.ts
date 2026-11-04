
import { Component, computed, effect, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';
import { ClinicPatientStore } from '../../../application/clinic-patient.store';


import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import type { PetSearchResource } from '../../../infrastructure/pet-search.resource';
import type { CreateClinicPatientCommand } from '../../../domain/model/create-clinic-patient.command';

import { ProfileApi } from '../../../infrastructure/profile-api';


import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Displays the directory of pets registered as patients
 * of the authenticated administrator's clinic.
 */
@Component({
  selector: 'app-clinic-patients',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './clinic-patients.html',
  styleUrl: './clinic-patients.css',
})
export class ClinicPatients {
  protected readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);
  protected readonly patientsStore = inject(ClinicPatientStore);
  private readonly profileApi = inject(ProfileApi);

  protected readonly clinic = this.clinicStore.clinic;
  protected readonly patients = this.patientsStore.patients;

  /**
   * Current search text.
   */
  protected readonly searchTerm = signal('');

  /**
   * Controls the patient registration panel.
   */
  protected readonly registrationOpen = signal(false);

  /**
   * Unique pet code entered by the administrator.
   */
  protected readonly petCodeInput = signal('');

  /**
   * Pet found through its unique code.
   */
  protected readonly foundPet = signal<PetSearchResource | null>(null);

  /**
   * Tracks the pet lookup request.
   */
  protected readonly searchingPet = signal(false);

  /**
   * Tracks whether the lookup was performed without results.
   */
  protected readonly petNotFound = signal(false);

  /**
   * Error message translation key.
   */
  protected readonly registrationError = signal<string | null>(null);

  /**
   * Success message translation key.
   */
  protected readonly registrationSuccess = signal<string | null>(null);

  /**
   * Prevents registration when the pet is already listed.
   */
  protected readonly alreadyRegistered = computed(() => {
    const pet = this.foundPet();

    return pet !== null && this.patients().some((patient) => patient.id === pet.id);
  });

  /**
   * Indicates whether the authenticated user
   * has clinic administrator permissions.
   */
  protected readonly isClinicAdmin = computed(
    () => this.iamStore.currentUser()?.hasRole('ROLE_CLINIC_ADMIN') ?? false,
  );

  /**
   * Indicates whether the authenticated user
   * can access the clinic patient directory.
   */
  protected readonly canViewPatients = computed(() => {
    const user = this.iamStore.currentUser();

    return user?.hasRole('ROLE_CLINIC_ADMIN') || user?.hasRole('ROLE_VETERINARIAN') || false;
  });

  /**
   * Filters registered patients without additional HTTP requests.
   */
  protected readonly filteredPatients = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const patients = this.patients();

    if (!search) {
      return patients;
    }

    return patients.filter((pet) => {
      const searchableText = [pet.name, pet.petCode, pet.species, pet.breed]
        .filter((value) => value != null)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  });

  constructor() {
    /**
     * Loads the clinic associated with the authenticated IAM account.
     */
    effect(() => {
      const currentUser = this.iamStore.currentUser();

      if (currentUser && this.canViewPatients()) {
        this.clinicStore.loadByAccountId(currentUser.accountId);
      }
    });

    /**
     * Loads registered patients after identifying the clinic.
     */
    effect(() => {
      const currentUser = this.iamStore.currentUser();
      const clinic = this.clinic();

      if (
        !currentUser ||
        !clinic ||
        !this.canViewPatients() ||
        clinic.accountId !== currentUser.accountId
      ) {
        return;
      }

      this.patientsStore.loadByClinicId(clinic.id);
    });
  }

  /**
   * Updates the search term.
   *
   * @param value the entered search text.
   */
  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  /**
   * Reloads patients belonging to the authenticated clinic.
   */
  protected refresh(): void {
    const currentUser = this.iamStore.currentUser();
    const clinic = this.clinic();

    if (
      !currentUser ||
      !clinic ||
      !this.canViewPatients() ||
      clinic.accountId !== currentUser.accountId
    ) {
      return;
    }

    this.patientsStore.loadByClinicId(clinic.id);
  }

  /**
   * Returns the translation key associated with a pet species.
   */
  protected speciesKey(species: string): string {
    switch (species.toUpperCase()) {
      case 'DOG':
        return 'profiles.pets.dog';

      case 'CAT':
        return 'profiles.pets.cat';

      default:
        return 'profiles.pets.other';
    }
  }

  /**
   * Opens the patient registration panel.
   */
  protected openRegistration(): void {
    if (!this.isClinicAdmin()) {
      return;
    }
    this.registrationOpen.set(true);
    this.petCodeInput.set('');
    this.foundPet.set(null);
    this.petNotFound.set(false);
    this.registrationError.set(null);
    this.registrationSuccess.set(null);
    this.patientsStore.clearError();
  }

  /**
   * Closes the patient registration panel.
   */
  protected closeRegistration(): void {
    if (this.searchingPet() || this.patientsStore.registering()) {
      return;
    }

    this.registrationOpen.set(false);
    this.foundPet.set(null);
    this.petCodeInput.set('');
    this.registrationError.set(null);
  }

  /**
   * Resets a previous search when the pet code changes.
   *
   * @param value the entered pet code.
   */
  protected onPetCodeChange(value: string): void {
    this.petCodeInput.set(value);
    this.foundPet.set(null);
    this.petNotFound.set(false);
    this.registrationError.set(null);
  }

  /**
   * Searches an existing pet by its unique identification code.
   */
  protected searchPet(): void {
    const petCode = this.petCodeInput().trim();

    if (!petCode || this.searchingPet() || this.patientsStore.registering()) {
      return;
    }

    this.searchingPet.set(true);
    this.foundPet.set(null);
    this.petNotFound.set(false);
    this.registrationError.set(null);

    this.profileApi
      .getPetByCode(petCode)
      .pipe(finalize(() => this.searchingPet.set(false)))
      .subscribe({
        next: (pet) => {
          this.foundPet.set(pet);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.petNotFound.set(true);
          } else if (error.status === 403) {
            this.registrationError.set('searchNotAuthorized');
          } else {
            this.registrationError.set('searchError');
          }
        },
      });
  }

  /**
   * Registers the selected existing pet as a clinic patient.
   */
  protected registerPatient(): void {
    const currentUser = this.iamStore.currentUser();
    const clinic = this.clinic();
    const pet = this.foundPet();

    if (
      !currentUser ||
      !currentUser.hasRole('ROLE_CLINIC_ADMIN') ||
      !clinic ||
      clinic.accountId !== currentUser.accountId ||
      !pet ||
      this.alreadyRegistered() ||
      this.patientsStore.registering()
    ) {
      return;
    }

    const command: CreateClinicPatientCommand = {
      clinicId: clinic.id,
      petId: pet.id,
    };

    this.registrationError.set(null);
    this.registrationSuccess.set(null);

    this.patientsStore.register(command).subscribe({
      next: () => {
        this.registrationSuccess.set('registered');
        this.registrationOpen.set(false);
        this.foundPet.set(null);
        this.petCodeInput.set('');

        // Refresh the directory after a successful registration.
        this.patientsStore.loadByClinicId(clinic.id);
      },
      error: (error: HttpErrorResponse) => {
        switch (error.status) {
          case 403:
            this.registrationError.set('registerNotAuthorized');
            break;

          case 404:
            this.registrationError.set('petUnavailable');
            break;

          case 409:
            this.registrationError.set('alreadyRegistered');
            break;

          default:
            this.registrationError.set('registerError');
        }
      },
    });
  }
}

