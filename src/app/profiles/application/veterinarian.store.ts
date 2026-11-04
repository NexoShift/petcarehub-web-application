
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { Veterinarian } from '../domain/model/veterinarian.entity';
import { ProfileApi } from '../infrastructure/profile-api';

import type { CreateVeterinarianCommand } from '../domain/model/create-veterinarian.command';
import type { UpdateVeterinarianCommand } from '../domain/model/update-veterinarian.command';

import type { CreateVeterinarianRequest } from '../infrastructure/create-veterinarian.request';
import type { UpdateVeterinarianRequest } from '../infrastructure/update-veterinarian.request';

/**
 * Manages veterinarian profile operations and state.
 *
 * @remarks
 * Coordinates profile retrieval, registration, updates,
 * image management, and clinic veterinarian queries.
 */
@Injectable({
  providedIn: 'root',
})
export class VeterinarianStore {
  private readonly profileApi = inject(ProfileApi);

  // State
  private readonly veterinarianSignal = signal<Veterinarian | null>(null);
  private readonly veterinariansSignal = signal<Veterinarian[]>([]);

  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly profileNotFoundSignal = signal(false);

  // Read-only state
  readonly veterinarian = this.veterinarianSignal.asReadonly();
  readonly veterinarians = this.veterinariansSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly profileNotFound = this.profileNotFoundSignal.asReadonly();

  // Derived state
  readonly hasProfile = computed(() => this.veterinarian() !== null);
  readonly veterinarianCount = computed(() => this.veterinarians().length);

  /**
   * Loads a veterinarian profile using its IAM user identifier.
   *
   * @param userId - The IAM user identifier.
   */
  loadByUserId(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
    this.veterinarianSignal.set(null);

    this.profileApi
      .getVeterinarianByUserId(userId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (veterinarian) => {
          this.veterinarianSignal.set(veterinarian);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.profileNotFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the veterinarian profile.');
          }
        },
      });
  }

  /**
   * Loads a veterinarian by its profile identifier.
   *
   * @param veterinarianId - The veterinarian profile identifier.
   */
  loadById(veterinarianId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
    this.veterinarianSignal.set(null);

    this.profileApi
      .getVeterinarianById(veterinarianId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (veterinarian) => {
          this.veterinarianSignal.set(veterinarian);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.profileNotFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the veterinarian profile.');
          }
        },
      });
  }

  /**
   * Loads all veterinarian profiles belonging to a clinic.
   *
   * @param clinicId - The clinic profile identifier.
   */
  loadByClinicId(clinicId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.veterinariansSignal.set([]);

    this.profileApi
      .getVeterinariansByClinicId(clinicId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (veterinarians) => {
          this.veterinariansSignal.set(veterinarians);
        },
        error: () => {
          this.errorSignal.set('Unable to load the clinic veterinarians.');
        },
      });
  }

  /**
   * Converts a creation command into an API request.
   */
  private toCreateVeterinarianRequest(
    command: CreateVeterinarianCommand,
    image: File | null,
  ): CreateVeterinarianRequest {
    return {
      userId: command.userId,
      clinicId: command.clinicId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phoneNumber: command.phoneNumber,
      sex: command.sex,
      licenseNumber: command.licenseNumber,
      specialty: command.specialty,
      image,
    };
  }

  /**
   * Creates a veterinarian profile.
   *
   * @param command - Professional registration information.
   * @param image - Optional profile image.
   * @returns The created veterinarian entity.
   */
  create(command: CreateVeterinarianCommand, image: File | null = null): Observable<Veterinarian> {
    const request = this.toCreateVeterinarianRequest(command, image);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.createVeterinarian(request).pipe(
      tap((veterinarian) => {
        this.veterinarianSignal.set(veterinarian);
        this.veterinariansSignal.update((veterinarians) => [...veterinarians, veterinarian]);
        this.profileNotFoundSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 409
            ? 'A veterinarian profile already exists for this user.'
            : 'Unable to create the veterinarian profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Converts an update command into an API request.
   */
  private toUpdateVeterinarianRequest(
    command: UpdateVeterinarianCommand,
  ): UpdateVeterinarianRequest {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      phoneNumber: command.phoneNumber,
      sex: command.sex,
      licenseNumber: command.licenseNumber,
      specialty: command.specialty,
    };
  }

  /**
   * Updates a veterinarian's personal and professional information.
   *
   * @param command - Updated veterinarian information.
   * @returns The updated veterinarian entity.
   */
  update(command: UpdateVeterinarianCommand): Observable<Veterinarian> {
    const request = this.toUpdateVeterinarianRequest(command);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updateVeterinarian(command.veterinarianId, request).pipe(
      tap((veterinarian) => this.replaceVeterinarian(veterinarian)),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this veterinarian.'
            : 'Unable to update the veterinarian profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Replaces a veterinarian's profile image.
   *
   * @param veterinarianId - The veterinarian profile identifier.
   * @param image - The new profile image.
   * @returns The updated veterinarian entity.
   */
  updateImage(veterinarianId: number, image: File): Observable<Veterinarian> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updateVeterinarianImage(veterinarianId, image).pipe(
      tap((veterinarian) => this.replaceVeterinarian(veterinarian)),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this veterinarian image.'
            : 'Unable to update the veterinarian image.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Replaces a veterinarian in the current state.
   *
   * @param updatedVeterinarian - The updated veterinarian entity.
   */
  private replaceVeterinarian(updatedVeterinarian: Veterinarian): void {
    if (this.veterinarian()?.id === updatedVeterinarian.id) {
      this.veterinarianSignal.set(updatedVeterinarian);
    }

    this.veterinariansSignal.update((veterinarians) =>
      veterinarians.map((veterinarian) =>
        veterinarian.id === updatedVeterinarian.id ? updatedVeterinarian : veterinarian,
      ),
    );
  }

  /**
   * Clears all veterinarian profile state.
   */
  clear(): void {
    this.veterinarianSignal.set(null);
    this.veterinariansSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
  }
}

