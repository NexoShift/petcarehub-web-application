import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Veterinarian } from '../domain/model/veterinarian.entity';
import { VeterinarianAssembler } from './veterinarian-assembler';

import type { VeterinarianResource } from './veterinarian.resource';
import type { CreateVeterinarianRequest } from './create-veterinarian.request';
import type { UpdateVeterinarianRequest } from './update-veterinarian.request';

/**
 * Provides HTTP operations for veterinarian profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class VeterinariansApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.profileVeterinariansEndpointPath}`;

  /**
   * Retrieves a veterinarian by its profile identifier.
   *
   * @param veterinarianId - The veterinarian profile identifier.
   * @returns The veterinarian entity.
   */
  getById(veterinarianId: number): Observable<Veterinarian> {
    return this.http
      .get<VeterinarianResource>(`${this.endpointUrl}/${veterinarianId}`)
      .pipe(map((resource) => VeterinarianAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves a veterinarian using its IAM user identifier.
   *
   * @param userId - The IAM user identifier.
   * @returns The associated veterinarian entity.
   */
  getByUserId(userId: number): Observable<Veterinarian> {
    return this.http
      .get<VeterinarianResource>(this.endpointUrl, {
        params: { userId: userId.toString() },
      })
      .pipe(map((resource) => VeterinarianAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates a veterinarian profile with an optional image.
   *
   * @param request - The veterinarian registration information.
   * @returns The created veterinarian entity.
   */
  create(request: CreateVeterinarianRequest): Observable<Veterinarian> {
    const formData = new FormData();

    formData.append('userId', request.userId.toString());
    formData.append('clinicId', request.clinicId.toString());
    formData.append('firstName', request.firstName);
    formData.append('lastName', request.lastName);
    formData.append('email', request.email);

    if (request.phoneNumber !== null) {
      formData.append('phoneNumber', request.phoneNumber);
    }

    if (request.sex !== null) {
      formData.append('sex', request.sex);
    }

    if (request.licenseNumber !== null) {
      formData.append('licenseNumber', request.licenseNumber);
    }

    if (request.specialty !== null) {
      formData.append('specialty', request.specialty);
    }

    if (request.image) {
      formData.append('image', request.image);
    }

    return this.http
      .post<VeterinarianResource>(this.endpointUrl, formData)
      .pipe(map((resource) => VeterinarianAssembler.toEntityFromResource(resource)));
  }

  /**
   * Updates a veterinarian's personal and professional information.
   *
   * @param veterinarianId - The veterinarian profile identifier.
   * @param request - The updated veterinarian information.
   * @returns The updated veterinarian entity.
   */
  update(veterinarianId: number, request: UpdateVeterinarianRequest): Observable<Veterinarian> {
    return this.http
      .put<VeterinarianResource>(`${this.endpointUrl}/${veterinarianId}`, request)
      .pipe(map((resource) => VeterinarianAssembler.toEntityFromResource(resource)));
  }

  /**
   * Replaces a veterinarian's profile image.
   *
   * @param veterinarianId - The veterinarian profile identifier.
   * @param image - The new profile image.
   * @returns The updated veterinarian entity.
   */
  updateImage(veterinarianId: number, image: File): Observable<Veterinarian> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http
      .put<VeterinarianResource>(`${this.endpointUrl}/${veterinarianId}/image`, formData)
      .pipe(map((resource) => VeterinarianAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves veterinarians belonging to a clinic.
   *
   * @param clinicId - The clinic identifier.
   * @returns The clinic's veterinarian profiles.
   */
  getByClinicId(clinicId: number): Observable<Veterinarian[]> {
    return this.http
      .get<VeterinarianResource[]>(
        `${environment.apiBaseUrl}${environment.profileClinicsEndpointPath}/${clinicId}${environment.profileVeterinariansEndpointPath}`,
      )
      .pipe(map((resources) => VeterinarianAssembler.toEntitiesFromResources(resources)));
  }
}
