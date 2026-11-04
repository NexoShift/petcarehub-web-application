
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Clinic } from '../domain/model/clinic.entity';
import { ClinicAssembler } from './clinic-assembler';

import type { ClinicResource } from './clinic.resource';
import type { CreateClinicRequest } from './create-clinic.request';
import type { UpdateClinicRequest } from './update-clinic.request';

/**
 * Provides HTTP operations for veterinary clinic profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class ClinicsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.profileClinicsEndpointPath}`;

  /**
   * Retrieves a clinic by its identifier.
   *
   * @param clinicId - The clinic profile identifier.
   * @returns The clinic entity.
   */
  getById(clinicId: number): Observable<Clinic> {
    return this.http
      .get<ClinicResource>(`${this.endpointUrl}/${clinicId}`)
      .pipe(map((resource) => ClinicAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves a clinic using its IAM account identifier.
   *
   * @param accountId - The IAM account identifier.
   * @returns The associated clinic entity.
   */
  getByAccountId(accountId: number): Observable<Clinic> {
    return this.http
      .get<ClinicResource>(this.endpointUrl, {
        params: { accountId: accountId.toString() },
      })
      .pipe(map((resource) => ClinicAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates a clinic profile with an optional image.
   *
   * @param request - The clinic registration information.
   * @returns The created clinic entity.
   */
  create(request: CreateClinicRequest): Observable<Clinic> {
    const formData = new FormData();

    formData.append('accountId', request.accountId.toString());
    formData.append('name', request.name);

    if (request.ruc !== null) {
      formData.append('ruc', request.ruc);
    }

    if (request.address !== null) {
      formData.append('address', request.address);
    }

    if (request.phoneNumber !== null) {
      formData.append('phoneNumber', request.phoneNumber);
    }

    if (request.description !== null) {
      formData.append('description', request.description);
    }

    if (request.image) {
      formData.append('image', request.image);
    }

    return this.http
      .post<ClinicResource>(this.endpointUrl, formData)
      .pipe(map((resource) => ClinicAssembler.toEntityFromResource(resource)));
  }

  /**
   * Updates a clinic's institutional information.
   *
   * @param clinicId - The clinic profile identifier.
   * @param request - The updated clinic information.
   * @returns The updated clinic entity.
   */
  update(clinicId: number, request: UpdateClinicRequest): Observable<Clinic> {
    return this.http
      .put<ClinicResource>(`${this.endpointUrl}/${clinicId}`, request)
      .pipe(map((resource) => ClinicAssembler.toEntityFromResource(resource)));
  }

  /**
   * Replaces a clinic's profile image.
   *
   * @param clinicId - The clinic profile identifier.
   * @param image - The new clinic image.
   * @returns The updated clinic entity.
   */
  updateImage(clinicId: number, image: File): Observable<Clinic> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http
      .put<ClinicResource>(`${this.endpointUrl}/${clinicId}/image`, formData)
      .pipe(map((resource) => ClinicAssembler.toEntityFromResource(resource)));
  }
}

