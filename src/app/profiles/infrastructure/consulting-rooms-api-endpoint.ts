
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ConsultingRoom } from '../domain/model/consulting-room.entity';
import { ConsultingRoomAssembler } from './consulting-room-assembler';

import type { ConsultingRoomResource } from './consulting-room.resource';
import type { CreateConsultingRoomRequest } from './create-consulting-room.request';
import type { UpdateConsultingRoomRequest } from './update-consulting-room.request';

/**
 * Provides HTTP operations for clinic consulting rooms.
 */
@Injectable({
  providedIn: 'root',
})
export class ConsultingRoomsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly clinicsUrl = `${environment.apiBaseUrl}${environment.profileClinicsEndpointPath}`;

  /**
   * Builds the consulting room collection URL.
   */
  private roomsUrl(clinicId: number): string {
    return `${this.clinicsUrl}/${clinicId}${environment.profileConsultingRoomsEndpointPath}`;
  }

  /**
   * Builds the URL of an individual consulting room.
   */
  private roomUrl(clinicId: number, roomId: number): string {
    return `${this.roomsUrl(clinicId)}/${roomId}`;
  }

  /**
   * Retrieves all consulting rooms of a clinic.
   */
  getByClinicId(clinicId: number): Observable<ConsultingRoom[]> {
    return this.http
      .get<ConsultingRoomResource[]>(this.roomsUrl(clinicId))
      .pipe(map((resources) => ConsultingRoomAssembler.toEntitiesFromResources(resources)));
  }

  /**
   * Retrieves a consulting room by its identifier.
   */
  getById(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.http
      .get<ConsultingRoomResource>(this.roomUrl(clinicId, roomId))
      .pipe(map((resource) => ConsultingRoomAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates a consulting room within a clinic.
   */
  create(clinicId: number, request: CreateConsultingRoomRequest): Observable<ConsultingRoom> {
    return this.http
      .post<ConsultingRoomResource>(this.roomsUrl(clinicId), request)
      .pipe(map((resource) => ConsultingRoomAssembler.toEntityFromResource(resource)));
  }

  /**
   * Updates a consulting room's information.
   */
  update(
    clinicId: number,
    roomId: number,
    request: UpdateConsultingRoomRequest,
  ): Observable<ConsultingRoom> {
    return this.http
      .put<ConsultingRoomResource>(this.roomUrl(clinicId, roomId), request)
      .pipe(map((resource) => ConsultingRoomAssembler.toEntityFromResource(resource)));
  }

  /**
   * Activates an existing consulting room.
   */
  activate(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.http
      .post<ConsultingRoomResource>(`${this.roomUrl(clinicId, roomId)}/activate`, {})
      .pipe(map((resource) => ConsultingRoomAssembler.toEntityFromResource(resource)));
  }

  /**
   * Deactivates an existing consulting room.
   */
  deactivate(clinicId: number, roomId: number): Observable<ConsultingRoom> {
    return this.http
      .post<ConsultingRoomResource>(`${this.roomUrl(clinicId, roomId)}/deactivate`, {})
      .pipe(map((resource) => ConsultingRoomAssembler.toEntityFromResource(resource)));
  }

  /**
   * Deletes a consulting room without assignment history.
   *
   * @returns A confirmation message.
   */
  delete(clinicId: number, roomId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.roomUrl(clinicId, roomId));
  }
}

