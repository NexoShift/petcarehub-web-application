import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ClinicPatient } from '../domain/model/clinic-patient.entity';
import { Pet } from '../domain/model/pet.entity';
import { Clinic } from '../domain/model/clinic.entity';

import { ClinicPatientAssembler } from './clinic-patient-assembler';
import { PetAssembler } from './pet-assembler';
import { ClinicAssembler } from './clinic-assembler';

import type { CreateClinicPatientRequest } from './create-clinic-patient.request';
import type { ClinicPatientResource } from './clinic-patient.resource';
import type { PetResource } from './pet.resource';
import type { ClinicResource } from './clinic.resource';

/**
 * Provides HTTP operations for clinic patients.
 */
@Injectable({
  providedIn: 'root',
})
export class ClinicPatientsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly clinicsUrl = `${environment.apiBaseUrl}${environment.profileClinicsEndpointPath}`;

  private readonly petsUrl = `${environment.apiBaseUrl}${environment.profilePetsEndpointPath}`;

  /**
   * Builds the patient collection URL for a clinic.
   */
  private patientsUrl(clinicId: number): string {
    return `${this.clinicsUrl}/${clinicId}${environment.profileClinicPatientsEndpointPath}`;
  }

  /**
   * Registers an existing pet as a clinic patient.
   *
   * @param clinicId - The clinic identifier.
   * @param request - The pet registration request.
   * @returns The created clinic patient entity.
   */
  create(clinicId: number, request: CreateClinicPatientRequest): Observable<ClinicPatient> {
    return this.http
      .post<ClinicPatientResource>(this.patientsUrl(clinicId), request)
      .pipe(map((resource) => ClinicPatientAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves pets registered as patients of a clinic.
   *
   * @param clinicId - The clinic identifier.
   * @returns The registered pet entities.
   */
  getByClinicId(clinicId: number): Observable<Pet[]> {
    return this.http
      .get<PetResource[]>(this.patientsUrl(clinicId))
      .pipe(map((resources) => PetAssembler.toEntitiesFromResources(resources)));
  }

  /**
   * Retrieves clinics where a pet is registered as a patient.
   *
   * @param petId - The pet identifier.
   * @returns The clinics associated with the pet.
   */
  getClinicsByPetId(petId: number): Observable<Clinic[]> {
    return this.http
      .get<ClinicResource[]>(`${this.petsUrl}/${petId}${environment.profileClinicsEndpointPath}`)
      .pipe(map((resources) => ClinicAssembler.toEntitiesFromResources(resources)));
  }
}
