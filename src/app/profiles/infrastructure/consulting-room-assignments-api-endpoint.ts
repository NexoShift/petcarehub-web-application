
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ConsultingRoomAssignment } from '../domain/model/consulting-room-assignment.entity';
import { ConsultingRoomAssignmentAssembler } from './consulting-room-assignment-assembler';

import type { ConsultingRoomAssignmentResource } from './consulting-room-assignment.resource';
import type { AssignVeterinarianRequest } from './assign-veterinarian.request';

/**
 * Provides HTTP operations for consulting room assignments.
 */
@Injectable({
  providedIn: 'root',
})
export class ConsultingRoomAssignmentsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly clinicsUrl = `${environment.apiBaseUrl}${environment.profileClinicsEndpointPath}`;

  /**
   * Builds the clinic assignment collection URL.
   */
  private assignmentsUrl(clinicId: number): string {
    return `${this.clinicsUrl}/${clinicId}${environment.profileConsultingRoomAssignmentsEndpointPath}`;
  }

  /**
   * Builds the assignment history URL for a consulting room.
   */
  private roomAssignmentsUrl(clinicId: number, roomId: number): string {
    return `${this.clinicsUrl}/${clinicId}${environment.profileConsultingRoomsEndpointPath}/${roomId}/assignments`;
  }

  /**
   * Assigns a veterinarian to a consulting room.
   *
   * @param clinicId - The clinic identifier.
   * @param request - The assignment information.
   * @returns A confirmation message.
   */
  assign(clinicId: number, request: AssignVeterinarianRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.assignmentsUrl(clinicId), request);
  }

  /**
   * Retrieves all consulting room assignments of a clinic.
   *
   * @param clinicId - The clinic identifier.
   * @returns The clinic's assignment records.
   */
  getByClinicId(clinicId: number): Observable<ConsultingRoomAssignment[]> {
    return this.http
      .get<ConsultingRoomAssignmentResource[]>(this.assignmentsUrl(clinicId))
      .pipe(
        map((resources) => ConsultingRoomAssignmentAssembler.toEntitiesFromResources(resources)),
      );
  }

  /**
   * Retrieves the assignment history of a consulting room.
   *
   * @param clinicId - The clinic identifier.
   * @param roomId - The consulting room identifier.
   * @returns The room's assignment history.
   */
  getByConsultingRoomId(clinicId: number, roomId: number): Observable<ConsultingRoomAssignment[]> {
    return this.http
      .get<ConsultingRoomAssignmentResource[]>(this.roomAssignmentsUrl(clinicId, roomId))
      .pipe(
        map((resources) => ConsultingRoomAssignmentAssembler.toEntitiesFromResources(resources)),
      );
  }

  /**
   * Retrieves the current assignment of a consulting room.
   *
   * @param clinicId - The clinic identifier.
   * @param roomId - The consulting room identifier.
   * @returns The active assignment.
   */
  getActiveByConsultingRoomId(
    clinicId: number,
    roomId: number,
  ): Observable<ConsultingRoomAssignment> {
    return this.http
      .get<ConsultingRoomAssignmentResource>(`${this.roomAssignmentsUrl(clinicId, roomId)}/active`)
      .pipe(map((resource) => ConsultingRoomAssignmentAssembler.toEntityFromResource(resource)));
  }

  /**
   * Ends a veterinarian assignment without deleting its history.
   *
   * @param clinicId - The clinic identifier.
   * @param assignmentId - The assignment identifier.
   * @returns A confirmation message.
   */
  unassign(clinicId: number, assignmentId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.assignmentsUrl(clinicId)}/${assignmentId}/unassignments`,
      {},
    );
  }
}

