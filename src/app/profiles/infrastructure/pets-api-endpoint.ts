import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Pet } from '../domain/model/pet.entity';
import { PetAssembler } from './pet-assembler';

import type { PetResource } from './pet.resource';
import type { PetSearchResource } from './pet-search.resource';
import type { CreatePetRequest } from './create-pet.request';
import type { UpdatePetRequest } from './update-pet.request';

/**
 * Provides HTTP operations for pet profiles.
 */
@Injectable({
  providedIn: 'root',
})
export class PetsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.profilePetsEndpointPath}`;

  private readonly petOwnersUrl = `${environment.apiBaseUrl}${environment.profilePetOwnersEndpointPath}`;

  /**
   * Retrieves a pet by its identifier.
   *
   * @param petId - The pet identifier.
   * @returns The pet entity.
   */
  getById(petId: number): Observable<Pet> {
    return this.http
      .get<PetResource>(`${this.endpointUrl}/${petId}`)
      .pipe(map((resource) => PetAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves the pets belonging to a pet owner.
   *
   * @param ownerId - The pet owner profile identifier.
   * @returns The owner's pet entities.
   */
  getByOwnerId(ownerId: number): Observable<Pet[]> {
    return this.http
      .get<PetResource[]>(`${this.petOwnersUrl}/${ownerId}/pets`)
      .pipe(map((resources) => PetAssembler.toEntitiesFromResources(resources)));
  }

  /**
   * Searches for a pet using its unique pet code.
   *
   * @param petCode - The unique pet code.
   * @returns The pet search result.
   */
  getByPetCode(petCode: string): Observable<PetSearchResource> {
    return this.http.get<PetSearchResource>(this.endpointUrl, {
      params: { petCode },
    });
  }

  /**
   * Creates a pet profile with an optional image.
   *
   * @param request - The pet registration information.
   * @returns The created pet entity.
   */
  create(request: CreatePetRequest): Observable<Pet> {
    const formData = new FormData();

    formData.append('ownerId', request.ownerId.toString());
    formData.append('name', request.name);
    formData.append('species', request.species);

    if (request.breed !== null) {
      formData.append('breed', request.breed);
    }

    if (request.birthDate !== null) {
      formData.append('birthDate', request.birthDate);
    }

    if (request.sex !== null) {
      formData.append('sex', request.sex);
    }

    if (request.image) {
      formData.append('image', request.image);
    }

    return this.http
      .post<PetResource>(this.endpointUrl, formData)
      .pipe(map((resource) => PetAssembler.toEntityFromResource(resource)));
  }

  /**
   * Updates a pet's profile information.
   *
   * @param petId - The pet identifier.
   * @param request - The updated pet information.
   * @returns The updated pet entity.
   */
  update(petId: number, request: UpdatePetRequest): Observable<Pet> {
    return this.http
      .put<PetResource>(`${this.endpointUrl}/${petId}`, request)
      .pipe(map((resource) => PetAssembler.toEntityFromResource(resource)));
  }

  /**
   * Replaces a pet's profile image.
   *
   * @param petId - The pet identifier.
   * @param image - The new profile image.
   * @returns The updated pet entity.
   */
  updateImage(petId: number, image: File): Observable<Pet> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http
      .put<PetResource>(`${this.endpointUrl}/${petId}/image`, formData)
      .pipe(map((resource) => PetAssembler.toEntityFromResource(resource)));
  }
}
