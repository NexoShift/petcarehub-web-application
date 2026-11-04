import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { Clinic } from '../domain/model/clinic.entity';
import { ProfileApi } from '../infrastructure/profile-api';

import type { CreateClinicCommand } from '../domain/model/create-clinic.command';
import type { UpdateClinicCommand } from '../domain/model/update-clinic.command';

import type { CreateClinicRequest } from '../infrastructure/create-clinic.request';
import type { UpdateClinicRequest } from '../infrastructure/update-clinic.request';

/**
 * Manages veterinary clinic profile operations and state.
 *
 * @remarks
 * Coordinates clinic profile retrieval, registration,
 * updates, and image management through the Profile API.
 */
@Injectable({
  providedIn: 'root',
})
export class ClinicStore {
  private readonly profileApi = inject(ProfileApi);

  // State
  private readonly clinicSignal = signal<Clinic | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly profileNotFoundSignal = signal(false);

  // Read-only state
  readonly clinic = this.clinicSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly profileNotFound = this.profileNotFoundSignal.asReadonly();

  // Derived state
  readonly hasProfile = computed(() => this.clinic() !== null);

  /**
   * Loads a clinic profile using its IAM account identifier.
   *
   * @param accountId - The IAM account identifier.
   */
  loadByAccountId(accountId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
    this.clinicSignal.set(null);

    this.profileApi
      .getClinicByAccountId(accountId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (clinic) => {
          this.clinicSignal.set(clinic);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.profileNotFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the clinic profile.');
          }
        },
      });
  }

  /**
   * Loads a clinic profile by its identifier.
   *
   * @param clinicId - The clinic profile identifier.
   */
  loadById(clinicId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
    this.clinicSignal.set(null);

    this.profileApi
      .getClinicById(clinicId)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (clinic) => {
          this.clinicSignal.set(clinic);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.profileNotFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the clinic profile.');
          }
        },
      });
  }

  /**
   * Converts a domain command into a creation request.
   */
  private toCreateClinicRequest(
    command: CreateClinicCommand,
    image: File | null,
  ): CreateClinicRequest {
    return {
      accountId: command.accountId,
      name: command.name,
      ruc: command.ruc,
      address: command.address,
      phoneNumber: command.phoneNumber,
      description: command.description,
      image,
    };
  }

  /**
   * Creates a veterinary clinic profile.
   *
   * @param command - Clinic registration information.
   * @param image - Optional clinic image.
   * @returns The created clinic entity.
   */
  create(command: CreateClinicCommand, image: File | null = null): Observable<Clinic> {
    const request = this.toCreateClinicRequest(command, image);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.createClinic(request).pipe(
      tap((clinic) => {
        this.clinicSignal.set(clinic);
        this.profileNotFoundSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 409
            ? 'A clinic profile already exists for this account.'
            : 'Unable to create the clinic profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Converts a domain command into an update request.
   */
  private toUpdateClinicRequest(command: UpdateClinicCommand): UpdateClinicRequest {
    return {
      name: command.name,
      ruc: command.ruc,
      address: command.address,
      phoneNumber: command.phoneNumber,
      description: command.description,
    };
  }

  /**
   * Updates a clinic's institutional information.
   *
   * @param command - Updated clinic information.
   * @returns The updated clinic entity.
   */
  update(command: UpdateClinicCommand): Observable<Clinic> {
    const request = this.toUpdateClinicRequest(command);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updateClinic(command.clinicId, request).pipe(
      tap((clinic) => {
        this.clinicSignal.set(clinic);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this clinic.'
            : 'Unable to update the clinic profile.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Replaces a clinic's profile image.
   *
   * @param clinicId - The clinic profile identifier.
   * @param image - The new clinic image.
   * @returns The updated clinic entity.
   */
  updateImage(clinicId: number, image: File): Observable<Clinic> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.updateClinicImage(clinicId, image).pipe(
      tap((clinic) => {
        this.clinicSignal.set(clinic);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to update this clinic image.'
            : 'Unable to update the clinic image.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  /**
   * Clears the current clinic profile state.
   */
  clear(): void {
    this.clinicSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.profileNotFoundSignal.set(false);
  }
}
