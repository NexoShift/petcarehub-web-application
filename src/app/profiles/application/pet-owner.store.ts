
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { PetOwner } from '../domain/model/pet-owner.entity';
import { ProfileApi } from '../infrastructure/profile-api';
import type { CreatePetOwnerCommand } from '../domain/model/create-pet-owner.command';
import type { UpdatePetOwnerCommand } from '../domain/model/update-pet-owner.command';

import type { CreatePetOwnerRequest } from '../infrastructure/create-pet-owner.request';
import type { UpdatePetOwnerRequest } from '../infrastructure/update-pet-owner.request';

import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

/**
 * Manages the state of the authenticated pet owner's profile.
 */
@Injectable({
  providedIn: 'root',
})
export class PetOwnerStore {
  private readonly profileApi = inject(ProfileApi);

  //State
  private readonly petOwnerSignal = signal<PetOwner | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly profileNotFoundSignal = signal(false);

  //Read only state
  readonly petOwner = this.petOwnerSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly profileNotFound = this.profileNotFoundSignal.asReadonly();

  readonly hasProfile = computed(() => this.petOwner() !== null);

  /**
   * Loads a pet owner profile using the authenticated IAM user identifier.
   *
   * @param userId - The authenticated IAM user identifier.
   */
  loadByUserId(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
    this.petOwnerSignal.set(null);

    this.profileApi.getPetOwnerByUserId(userId).subscribe({
      next: (petOwner) => {
        this.petOwnerSignal.set(petOwner);
        this.loadingSignal.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.profileNotFoundSignal.set(true);
        } else {
          this.errorSignal.set('Unable to load the pet owner profile.');
        }

        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * Creates a pet owner profile and updates the current state.
   *
   * @param command - Profile registration information.
   * @param image - Optional profile image.
   * @returns The created pet owner entity.
   */
  create(command: CreatePetOwnerCommand, image: File | null = null): Observable<PetOwner> {
    const request = this.toCreatePetOwnerRequest(command, image);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.createPetOwner(request).pipe(
      tap((petOwner) => {
        this.petOwnerSignal.set(petOwner);
        this.profileNotFoundSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 409
            ? 'A profile already exists for this account.'
            : 'Unable to create the pet owner profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Updates a pet owner's personal information.
   *
   * @param command - The updated profile information.
   * @returns The updated pet owner entity.
   */
  update(command: UpdatePetOwnerCommand): Observable<PetOwner> {
    const request = this.toUpdatePetOwnerRequest(command);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updatePetOwner(command.petOwnerId, request).pipe(
      tap((petOwner) => {
        this.petOwnerSignal.set(petOwner);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this profile.'
            : 'Unable to update the pet owner profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Updates a pet owner's profile image.
   *
   * @param petOwnerId - The pet owner profile identifier.
   * @param image - The new profile image.
   * @returns The updated pet owner entity.
   */
  updateImage(petOwnerId: number, image: File): Observable<PetOwner> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updatePetOwnerImage(petOwnerId, image).pipe(
      tap((petOwner) => {
        this.petOwnerSignal.set(petOwner);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this profile image.'
            : 'Unable to update the pet owner profile image.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Converts a domain command into an API request.
   */
  private toCreatePetOwnerRequest(
    command: CreatePetOwnerCommand,
    image: File | null,
  ): CreatePetOwnerRequest {
    return {
      userId: command.userId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phoneNumber: command.phoneNumber,
      sex: command.sex,
      image,
    };
  }

  /**
   * Converts an update command into an API request.
   */
  private toUpdatePetOwnerRequest(command: UpdatePetOwnerCommand): UpdatePetOwnerRequest {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      phoneNumber: command.phoneNumber,
      sex: command.sex,
    };
  }

  /**
   * Clears the current pet owner profile state.
   */
  clear(): void {
    this.petOwnerSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
  }
}

