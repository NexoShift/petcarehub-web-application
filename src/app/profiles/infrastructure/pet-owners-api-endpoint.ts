import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PetOwner } from '../domain/model/pet-owner.entity';
import { PetOwnerResource } from './pet-owner.response';
import { PetOwnerAssembler } from './pet-owner-assembler';
import { CreatePetOwnerRequest } from './create-pet-owner.request';
import { UpdatePetOwnerRequest } from './update-pet-owner.request';


/**
 * Provides HTTP operations for pet owner profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class PetOwnersApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.profilePetOwnersEndpointPath}`;

  /**
   * Retrieves a pet owner profile by its IAM user identifier.
   *
   * @param userId - The IAM user identifier.
   * @returns The pet owner entity.
   */
  getByUserId(userId: number): Observable<PetOwner> {
    return this.http
      .get<PetOwnerResource>(this.endpointUrl, {
        params: { userId: userId.toString() },
      })
      .pipe(map((resource) => PetOwnerAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates a pet owner profile with an optional image.
   *
   * @param request - Profile information and optional image.
   * @returns The created pet owner entity.
   */
  create(request: CreatePetOwnerRequest): Observable<PetOwner> {
    const formData = new FormData();

    formData.append('userId', request.userId.toString());
    formData.append('firstName', request.firstName);
    formData.append('lastName', request.lastName);
    formData.append('email', request.email);

    if (request.phoneNumber !== null) {
      formData.append('phoneNumber', request.phoneNumber);
    }

    if (request.sex !== null) {
      formData.append('sex', request.sex);
    }

    if (request.image) {
      formData.append('image', request.image);
    }

    return this.http
      .post<PetOwnerResource>(this.endpointUrl, formData)
      .pipe(map((resource) => PetOwnerAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves a pet owner profile by its identifier.
   *
   * @param petOwnerId - The pet owner profile identifier.
   * @returns The pet owner entity.
   */
  getById(petOwnerId: number): Observable<PetOwner> {
    return this.http
      .get<PetOwnerResource>(`${this.endpointUrl}/${petOwnerId}`)
      .pipe(map((resource) => PetOwnerAssembler.toEntityFromResource(resource)));
  }

  /**
   * Updates a pet owner's personal information.
   *
   * @param petOwnerId - The pet owner profile identifier.
   * @param request - The updated profile information.
   * @returns The updated pet owner entity.
   */
  update(petOwnerId: number, request: UpdatePetOwnerRequest): Observable<PetOwner> {
    return this.http
      .put<PetOwnerResource>(`${this.endpointUrl}/${petOwnerId}`, request)
      .pipe(map((resource) => PetOwnerAssembler.toEntityFromResource(resource)));
  }

  /**
   * Replaces a pet owner's profile image.
   *
   * @param petOwnerId - The pet owner profile identifier.
   * @param image - The new profile image.
   * @returns The updated pet owner entity.
   */
  updateImage(petOwnerId: number, image: File): Observable<PetOwner> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http
      .put<PetOwnerResource>(`${this.endpointUrl}/${petOwnerId}/profile-image`, formData)
      .pipe(map((resource) => PetOwnerAssembler.toEntityFromResource(resource)));
  }
}
