
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { ProfileApi } from '../infrastructure/profile-api';
import { Pet } from '../domain/model/pet.entity';

import type { CreatePetCommand } from '../domain/model/create-pet.command';
import type { UpdatePetCommand } from '../domain/model/update-pet.command';

import type { CreatePetRequest } from '../infrastructure/create-pet.request';
import type { UpdatePetRequest } from '../infrastructure/update-pet.request';
import type { PetSearchResource } from '../infrastructure/pet-search.resource';

/**
 * Manages pet profile operations and state.
 *
 * @remarks
 * Coordinates pet retrieval, registration, updates,
 * image management, and searches through the Profile API.
 */
@Injectable({
  providedIn: 'root',
})
export class PetStore {
  private readonly profileApi = inject(ProfileApi);

  // State
  private readonly petsSignal = signal<Pet[]>([]);
  private readonly selectedPetSignal = signal<Pet | null>(null);
  private readonly searchResultSignal = signal<PetSearchResource | null>(null);

  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly notFoundSignal = signal(false);

  // Read-only state
  readonly pets = this.petsSignal.asReadonly();
  readonly selectedPet = this.selectedPetSignal.asReadonly();
  readonly searchResult = this.searchResultSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly notFound = this.notFoundSignal.asReadonly();

  // Derived state
  readonly hasPets = computed(() => this.pets().length > 0);
  readonly petCount = computed(() => this.pets().length);

  /**
   * Loads all pets belonging to a pet owner.
   *
   * @param ownerId - The pet owner profile identifier.
   */
  loadByOwnerId(ownerId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
    this.petsSignal.set([]);

    this.profileApi
      .getPetsByOwnerId(ownerId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (pets) => {
          this.petsSignal.set(pets);
        },
        error: () => {
          this.errorSignal.set('Unable to load the pet profiles.');
        },
      });
  }

  /**
   * Loads a pet by its identifier.
   *
   * @param petId - The pet identifier.
   */
  loadById(petId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
    this.selectedPetSignal.set(null);

    this.profileApi
      .getPetById(petId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (pet) => {
          this.selectedPetSignal.set(pet);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.notFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the pet profile.');
          }
        },
      });
  }

  /**
   * Searches for a pet using its unique pet code.
   *
   * @param petCode - The pet code.
   */
  searchByPetCode(petCode: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
    this.searchResultSignal.set(null);

    this.profileApi
      .getPetByCode(petCode.trim())
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (result) => {
          this.searchResultSignal.set(result);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.notFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to search for the pet.');
          }
        },
      });
  }

  /**
   * Converts a creation command into an API request.
   */
  private toCreatePetRequest(command: CreatePetCommand, image: File | null): CreatePetRequest {
    return {
      ownerId: command.ownerId,
      name: command.name,
      species: command.species,
      breed: command.breed,
      birthDate: command.birthDate,
      sex: command.sex,
      image,
    };
  }

  /**
   * Creates a pet profile.
   *
   * @param command - Pet registration information.
   * @param image - Optional pet image.
   * @returns The created pet entity.
   */
  create(command: CreatePetCommand, image: File | null = null): Observable<Pet> {
    const request = this.toCreatePetRequest(command, image);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.createPet(request).pipe(
      tap((pet) => {
        this.petsSignal.update((pets) => [...pets, pet]);
        this.selectedPetSignal.set(pet);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to register a pet for this owner.'
            : 'Unable to create the pet profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Converts an update command into an API request.
   */
  private toUpdatePetRequest(command: UpdatePetCommand): UpdatePetRequest {
    return {
      name: command.name,
      species: command.species,
      breed: command.breed,
      birthDate: command.birthDate,
      sex: command.sex,
    };
  }

  /**
   * Updates a pet's profile information.
   *
   * @param command - Updated pet information.
   * @returns The updated pet entity.
   */
  update(command: UpdatePetCommand): Observable<Pet> {
    const request = this.toUpdatePetRequest(command);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updatePet(command.petId, request).pipe(
      tap((pet) => this.replacePet(pet)),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this pet.'
            : 'Unable to update the pet profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Replaces a pet's profile image.
   *
   * @param petId - The pet identifier.
   * @param image - The new pet image.
   * @returns The updated pet entity.
   */
  updateImage(petId: number, image: File): Observable<Pet> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updatePetImage(petId, image).pipe(
      tap((pet) => this.replacePet(pet)),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this pet image.'
            : 'Unable to update the pet image.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Replaces a pet in the collection and selected state.
   *
   * @param updatedPet - The updated pet entity.
   */
  private replacePet(updatedPet: Pet): void {
    this.petsSignal.update((pets) =>
      pets.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)),
    );

    if (this.selectedPet()?.id === updatedPet.id) {
      this.selectedPetSignal.set(updatedPet);
    }
  }

  /**
   * Clears the pet search result.
   */
  clearSearch(): void {
    this.searchResultSignal.set(null);
    this.notFoundSignal.set(false);
    this.errorSignal.set(null);
  }

  /**
   * Clears all pet profile state.
   */
  clear(): void {
    this.petsSignal.set([]);
    this.selectedPetSignal.set(null);
    this.searchResultSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
  }
}

