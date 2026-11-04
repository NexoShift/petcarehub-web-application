import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { ClinicPatient } from '../domain/model/clinic-patient.entity';
import { Pet } from '../domain/model/pet.entity';
import { Clinic } from '../domain/model/clinic.entity';

import { ProfileApi } from '../infrastructure/profile-api';

import type { CreateClinicPatientCommand } from '../domain/model/create-clinic-patient.command';
import type { CreateClinicPatientRequest } from '../infrastructure/create-clinic-patient.request';

/**
 * Manages clinic patient registrations and queries.
 *
 * @remarks
 * Coordinates patient registration, clinic patient lists,
 * and the clinics associated with an existing pet.
 */
@Injectable({
  providedIn: 'root',
})
export class ClinicPatientStore {
  private readonly profileApi = inject(ProfileApi);

  // State
  private readonly patientsSignal = signal<Pet[]>([]);
  private readonly clinicsSignal = signal<Clinic[]>([]);
  private readonly lastRegistrationSignal = signal<ClinicPatient | null>(null);

  private readonly loadingPatientsSignal = signal(false);
  private readonly loadingClinicsSignal = signal(false);
  private readonly registeringSignal = signal(false);

  private readonly errorSignal = signal<string | null>(null);

  // Read-only state
  readonly patients = this.patientsSignal.asReadonly();
  readonly clinics = this.clinicsSignal.asReadonly();
  readonly lastRegistration = this.lastRegistrationSignal.asReadonly();

  readonly loadingPatients = this.loadingPatientsSignal.asReadonly();
  readonly loadingClinics = this.loadingClinicsSignal.asReadonly();
  readonly registering = this.registeringSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();

  // Derived state
  readonly loading = computed(
    () => this.loadingPatients() || this.loadingClinics() || this.registering(),
  );

  readonly hasPatients = computed(() => this.patients().length > 0);
  readonly patientCount = computed(() => this.patients().length);
  readonly hasClinics = computed(() => this.clinics().length > 0);

  /**
   * Loads pets registered as patients of a clinic.
   *
   * @param clinicId - The clinic profile identifier.
   */
  loadByClinicId(clinicId: number): void {
    this.loadingPatientsSignal.set(true);
    this.errorSignal.set(null);
    this.patientsSignal.set([]);

    this.profileApi
      .getPatientsByClinicId(clinicId)
      .pipe(finalize(() => this.loadingPatientsSignal.set(false)))
      .subscribe({
        next: (patients) => {
          this.patientsSignal.set(patients);
        },
        error: (error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 403
              ? 'You are not allowed to view these clinic patients.'
              : 'Unable to load the clinic patients.',
          );
        },
      });
  }

  /**
   * Loads clinics where a pet is registered as a patient.
   *
   * @param petId - The pet identifier.
   */
  loadClinicsByPetId(petId: number): void {
    this.loadingClinicsSignal.set(true);
    this.errorSignal.set(null);
    this.clinicsSignal.set([]);

    this.profileApi
      .getClinicsByPetId(petId)
      .pipe(finalize(() => this.loadingClinicsSignal.set(false)))
      .subscribe({
        next: (clinics) => {
          this.clinicsSignal.set(clinics);
        },
        error: (error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 403
              ? 'You are not allowed to view this pet clinic history.'
              : 'Unable to load the clinics associated with this pet.',
          );
        },
      });
  }

  /**
   * Converts a registration command into an API request.
   *
   * @param command - The clinic patient registration command.
   * @returns The registration request.
   */
  private toCreateClinicPatientRequest(
    command: CreateClinicPatientCommand,
  ): CreateClinicPatientRequest {
    return {
      petId: command.petId,
    };
  }

  /**
   * Registers an existing pet as a patient of a clinic.
   *
   * @param command - The clinic and pet identifiers.
   * @returns The created clinic patient registration.
   */
  register(command: CreateClinicPatientCommand): Observable<ClinicPatient> {
    const request = this.toCreateClinicPatientRequest(command);

    this.registeringSignal.set(true);
    this.errorSignal.set(null);
    this.lastRegistrationSignal.set(null);

    return this.profileApi.registerClinicPatient(command.clinicId, request).pipe(
      tap((registration) => {
        this.lastRegistrationSignal.set(registration);
      }),
      catchError((error: HttpErrorResponse) => {
        let message = 'Unable to register the clinic patient.';

        if (error.status === 403) {
          message = 'You are not allowed to register patients for this clinic.';
        } else if (error.status === 404) {
          message = 'The clinic or pet could not be found.';
        } else if (error.status === 409) {
          message = 'This pet is already registered as a patient of this clinic.';
        }

        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => this.registeringSignal.set(false)),
    );
  }

  /**
   * Clears the current error message.
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Clears clinic patient state.
   */
  clear(): void {
    this.patientsSignal.set([]);
    this.clinicsSignal.set([]);
    this.lastRegistrationSignal.set(null);

    this.loadingPatientsSignal.set(false);
    this.loadingClinicsSignal.set(false);
    this.registeringSignal.set(false);

    this.errorSignal.set(null);
  }
}
