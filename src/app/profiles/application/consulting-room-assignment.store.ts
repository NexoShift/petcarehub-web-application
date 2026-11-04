import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { ConsultingRoomAssignment } from '../domain/model/consulting-room-assignment.entity';
import { ProfileApi } from '../infrastructure/profile-api';

import type { AssignVeterinarianCommand } from '../domain/model/assign-veterinarian.command';
import type { UnassignVeterinarianCommand } from '../domain/model/unassign-veterinarian.command';
import type { AssignVeterinarianRequest } from '../infrastructure/assign-veterinarian.request';

/**
 * Manages consulting room assignments and their history.
 *
 * @remarks
 * Coordinates assignment queries, veterinarian assignments,
 * unassignments, and state synchronization.
 */
@Injectable({
  providedIn: 'root',
})
export class ConsultingRoomAssignmentStore {
  private readonly profileApi = inject(ProfileApi);

  // Context
  private readonly clinicIdSignal = signal<number | null>(null);
  private readonly roomIdSignal = signal<number | null>(null);

  // State
  private readonly assignmentsSignal = signal<ConsultingRoomAssignment[]>([]);

  private readonly roomAssignmentsSignal = signal<ConsultingRoomAssignment[]>([]);

  private readonly activeAssignmentSignal = signal<ConsultingRoomAssignment | null>(null);

  private readonly loadingAssignmentsSignal = signal(false);
  private readonly loadingRoomAssignmentsSignal = signal(false);
  private readonly loadingActiveAssignmentSignal = signal(false);
  private readonly savingSignal = signal(false);

  private readonly errorSignal = signal<string | null>(null);

  // Read-only state
  readonly assignments = this.assignmentsSignal.asReadonly();
  readonly roomAssignments = this.roomAssignmentsSignal.asReadonly();
  readonly activeAssignment = this.activeAssignmentSignal.asReadonly();

  readonly loadingAssignments = this.loadingAssignmentsSignal.asReadonly();
  readonly loadingRoomAssignments = this.loadingRoomAssignmentsSignal.asReadonly();

  readonly loadingActiveAssignment = this.loadingActiveAssignmentSignal.asReadonly();

  readonly saving = this.savingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Derived state
  readonly loading = computed(
    () =>
      this.loadingAssignments() ||
      this.loadingRoomAssignments() ||
      this.loadingActiveAssignment() ||
      this.saving(),
  );

  readonly assignmentCount = computed(() => this.assignments().length);

  readonly activeAssignments = computed(() =>
    this.assignments().filter((assignment) => assignment.active),
  );

  readonly activeAssignmentCount = computed(() => this.activeAssignments().length);

  readonly hasActiveAssignment = computed(() => this.activeAssignment() !== null);

  /**
   * Loads all consulting room assignments of a clinic.
   *
   * @param clinicId - The clinic profile identifier.
   */
  loadByClinicId(clinicId: number): void {
    this.clinicIdSignal.set(clinicId);
    this.loadingAssignmentsSignal.set(true);
    this.errorSignal.set(null);
    this.assignmentsSignal.set([]);

    this.profileApi
      .getAssignmentsByClinicId(clinicId)
      .pipe(finalize(() => this.loadingAssignmentsSignal.set(false)))
      .subscribe({
        next: (assignments) => {
          if (this.clinicIdSignal() === clinicId) {
            this.assignmentsSignal.set(assignments);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 403
              ? 'You are not allowed to view these assignments.'
              : 'Unable to load the clinic assignments.',
          );
        },
      });
  }

  /**
   * Loads the assignment history of a consulting room.
   *
   * @param clinicId - The clinic profile identifier.
   * @param roomId - The consulting room identifier.
   */
  loadByConsultingRoomId(clinicId: number, roomId: number): void {
    this.clinicIdSignal.set(clinicId);
    this.roomIdSignal.set(roomId);

    this.loadingRoomAssignmentsSignal.set(true);
    this.errorSignal.set(null);
    this.roomAssignmentsSignal.set([]);
    this.activeAssignmentSignal.set(null);

    this.profileApi
      .getAssignmentsByConsultingRoomId(clinicId, roomId)
      .pipe(finalize(() => this.loadingRoomAssignmentsSignal.set(false)))
      .subscribe({
        next: (assignments) => {
          if (this.clinicIdSignal() === clinicId && this.roomIdSignal() === roomId) {
            this.roomAssignmentsSignal.set(assignments);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 404
              ? 'The consulting room could not be found.'
              : 'Unable to load the assignment history.',
          );
        },
      });
  }

  /**
   * Loads the active veterinarian assignment of a consulting room.
   *
   * @param clinicId - The clinic profile identifier.
   * @param roomId - The consulting room identifier.
   */
  loadActiveByConsultingRoomId(clinicId: number, roomId: number): void {
    this.clinicIdSignal.set(clinicId);
    this.roomIdSignal.set(roomId);

    this.loadingActiveAssignmentSignal.set(true);
    this.errorSignal.set(null);
    this.activeAssignmentSignal.set(null);

    this.profileApi
      .getActiveAssignmentByConsultingRoomId(clinicId, roomId)
      .pipe(finalize(() => this.loadingActiveAssignmentSignal.set(false)))
      .subscribe({
        next: (assignment) => {
          if (this.clinicIdSignal() === clinicId && this.roomIdSignal() === roomId) {
            this.activeAssignmentSignal.set(assignment);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            // No active assignment exists for this room.
            return;
          }

          this.errorSignal.set(
            error.status === 403
              ? 'You are not allowed to view this assignment.'
              : 'Unable to load the active assignment.',
          );
        },
      });
  }

  /**
   * Converts a domain command into an API request.
   */
  private toAssignRequest(command: AssignVeterinarianCommand): AssignVeterinarianRequest {
    return {
      consultingRoomId: command.consultingRoomId,
      veterinarianId: command.veterinarianId,
    };
  }

  /**
   * Assigns a veterinarian to a consulting room.
   *
   * @param command - The veterinarian assignment command.
   * @returns The confirmation message.
   */
  assign(command: AssignVeterinarianCommand): Observable<{ message: string }> {
    const request = this.toAssignRequest(command);

    this.savingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.assignVeterinarian(command.clinicId, request).pipe(
      tap(() => {
        this.refreshAfterChange(command.clinicId, command.consultingRoomId);
      }),
      catchError((error: HttpErrorResponse) => {
        let message = 'Unable to assign the veterinarian.';

        if (error.status === 403) {
          message = 'You are not allowed to manage assignments.';
        } else if (error.status === 404) {
          message = 'The clinic, room, or veterinarian was not found.';
        } else if (error.status === 409) {
          message = 'The veterinarian assignment conflicts with an existing assignment.';
        }

        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  /**
   * Ends an active veterinarian assignment.
   *
   * @param command - The assignment to terminate.
   * @returns The confirmation message.
   */
  unassign(command: UnassignVeterinarianCommand): Observable<{ message: string }> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    const assignment = [...this.assignments(), ...this.roomAssignments()].find(
      (item) => item.id === command.assignmentId,
    );

    return this.profileApi.unassignVeterinarian(command.clinicId, command.assignmentId).pipe(
      tap(() => {
        this.refreshAfterChange(command.clinicId, assignment?.consultingRoomId ?? null);
      }),
      catchError((error: HttpErrorResponse) => {
        let message = 'Unable to unassign the veterinarian.';

        if (error.status === 403) {
          message = 'You are not allowed to manage assignments.';
        } else if (error.status === 404) {
          message = 'The assignment could not be found.';
        } else if (error.status === 409) {
          message = 'This assignment is already inactive.';
        }

        this.errorSignal.set(message);
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  /**
   * Refreshes assignment data after a successful modification.
   *
   * @remarks
   * Mutation endpoints return confirmation messages instead
   * of updated assignment resources.
   */
  private refreshAfterChange(clinicId: number, affectedRoomId: number | null): void {
    if (this.clinicIdSignal() !== clinicId) {
      return;
    }

    this.loadByClinicId(clinicId);

    if (affectedRoomId !== null && this.roomIdSignal() === affectedRoomId) {
      this.loadByConsultingRoomId(clinicId, affectedRoomId);
      this.loadActiveByConsultingRoomId(clinicId, affectedRoomId);
    }
  }

  /**
   * Clears the current error message.
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Clears all consulting room assignment state.
   */
  clear(): void {
    this.clinicIdSignal.set(null);
    this.roomIdSignal.set(null);

    this.assignmentsSignal.set([]);
    this.roomAssignmentsSignal.set([]);
    this.activeAssignmentSignal.set(null);

    this.loadingAssignmentsSignal.set(false);
    this.loadingRoomAssignmentsSignal.set(false);
    this.loadingActiveAssignmentSignal.set(false);
    this.savingSignal.set(false);

    this.errorSignal.set(null);
  }
}
