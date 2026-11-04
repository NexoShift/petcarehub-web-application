
import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';

import { ConsultingRoom } from '../domain/model/consulting-room.entity';
import { ProfileApi } from '../infrastructure/profile-api';

import type { CreateConsultingRoomCommand } from '../domain/model/create-consulting-room.command';
import type { UpdateConsultingRoomCommand } from '../domain/model/update-consulting-room.command';
import type { ActivateConsultingRoomCommand } from '../domain/model/activate-consulting-room.command';
import type { DeactivateConsultingRoomCommand } from '../domain/model/deactivate-consulting-room.command';
import type { DeleteConsultingRoomCommand } from '../domain/model/delete-consulting-room.command';

import type { CreateConsultingRoomRequest } from '../infrastructure/create-consulting-room.request';
import type { UpdateConsultingRoomRequest } from '../infrastructure/update-consulting-room.request';

/**
 * Manages consulting room operations and state.
 *
 * @remarks
 * Coordinates consulting room queries, registration,
 * updates, activation, deactivation, and deletion.
 */
@Injectable({
  providedIn: 'root',
})
export class ConsultingRoomStore {
  private readonly profileApi = inject(ProfileApi);

  // State
  private readonly roomsSignal = signal<ConsultingRoom[]>([]);
  private readonly selectedRoomSignal = signal<ConsultingRoom | null>(null);

  private readonly loadingRoomsSignal = signal(false);
  private readonly loadingRoomSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly deletingSignal = signal(false);

  private readonly errorSignal = signal<string | null>(null);
  private readonly notFoundSignal = signal(false);

  // Read-only state
  readonly rooms = this.roomsSignal.asReadonly();
  readonly selectedRoom = this.selectedRoomSignal.asReadonly();

  readonly loadingRooms = this.loadingRoomsSignal.asReadonly();
  readonly loadingRoom = this.loadingRoomSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly deleting = this.deletingSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();
  readonly notFound = this.notFoundSignal.asReadonly();

  // Derived state
  readonly loading = computed(
    () => this.loadingRooms() || this.loadingRoom() || this.saving() || this.deleting(),
  );

  readonly hasRooms = computed(() => this.rooms().length > 0);
  readonly roomCount = computed(() => this.rooms().length);

  readonly activeRooms = computed(() => this.rooms().filter((room) => room.active));

  readonly inactiveRooms = computed(() => this.rooms().filter((room) => !room.active));

  readonly activeRoomCount = computed(() => this.activeRooms().length);

  /**
   * Loads all consulting rooms belonging to a clinic.
   *
   * @param clinicId - The clinic profile identifier.
   */
  loadByClinicId(clinicId: number): void {
    this.loadingRoomsSignal.set(true);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
    this.roomsSignal.set([]);

    this.profileApi
      .getConsultingRoomsByClinicId(clinicId)
      .pipe(finalize(() => this.loadingRoomsSignal.set(false)))
      .subscribe({
        next: (rooms) => {
          this.roomsSignal.set(rooms);
        },
        error: (error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 403
              ? 'You are not allowed to view these consulting rooms.'
              : 'Unable to load the consulting rooms.',
          );
        },
      });
  }

  /**
   * Loads a consulting room by its identifier.
   *
   * @param clinicId - The clinic profile identifier.
   * @param roomId - The consulting room identifier.
   */
  loadById(clinicId: number, roomId: number): void {
    this.loadingRoomSignal.set(true);
    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
    this.selectedRoomSignal.set(null);

    this.profileApi
      .getConsultingRoomById(clinicId, roomId)
      .pipe(finalize(() => this.loadingRoomSignal.set(false)))
      .subscribe({
        next: (room) => {
          this.selectedRoomSignal.set(room);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.notFoundSignal.set(true);
          } else {
            this.errorSignal.set('Unable to load the consulting room.');
          }
        },
      });
  }

  /**
   * Converts a creation command into an API request.
   */
  private toCreateRequest(command: CreateConsultingRoomCommand): CreateConsultingRoomRequest {
    return {
      name: command.name,
      description: command.description,
    };
  }

  /**
   * Creates a consulting room within a clinic.
   *
   * @param command - The consulting room registration data.
   * @returns The created consulting room.
   */
  create(command: CreateConsultingRoomCommand): Observable<ConsultingRoom> {
    const request = this.toCreateRequest(command);

    this.savingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.createConsultingRoom(command.clinicId, request).pipe(
      tap((room) => {
        this.roomsSignal.update((rooms) => [...rooms, room]);
        this.selectedRoomSignal.set(room);
        this.notFoundSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 409
            ? 'A consulting room with this name already exists.'
            : 'Unable to create the consulting room.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  /**
   * Converts an update command into an API request.
   */
  private toUpdateRequest(command: UpdateConsultingRoomCommand): UpdateConsultingRoomRequest {
    return {
      name: command.name,
      description: command.description,
    };
  }

  /**
   * Updates a consulting room's name and description.
   *
   * @param command - The updated consulting room information.
   * @returns The updated consulting room.
   */
  update(command: UpdateConsultingRoomCommand): Observable<ConsultingRoom> {
    const request = this.toUpdateRequest(command);

    this.savingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi
      .updateConsultingRoom(command.clinicId, command.consultingRoomId, request)
      .pipe(
        tap((room) => this.replaceRoom(room)),
        catchError((error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 409
              ? 'A consulting room with this name already exists.'
              : 'Unable to update the consulting room.',
          );
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
      );
  }

  /**
   * Activates an existing consulting room.
   *
   * @param command - The consulting room to activate.
   * @returns The activated consulting room.
   */
  activate(command: ActivateConsultingRoomCommand): Observable<ConsultingRoom> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.activateConsultingRoom(command.clinicId, command.consultingRoomId).pipe(
      tap((room) => this.replaceRoom(room)),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 403
            ? 'You are not allowed to activate this consulting room.'
            : 'Unable to activate the consulting room.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.savingSignal.set(false)),
    );
  }

  /**
   * Deactivates an existing consulting room.
   *
   * @param command - The consulting room to deactivate.
   * @returns The deactivated consulting room.
   */
  deactivate(command: DeactivateConsultingRoomCommand): Observable<ConsultingRoom> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi
      .deactivateConsultingRoom(command.clinicId, command.consultingRoomId)
      .pipe(
        tap((room) => this.replaceRoom(room)),
        catchError((error: HttpErrorResponse) => {
          this.errorSignal.set(
            error.status === 409
              ? 'This room has an active veterinarian assignment.'
              : 'Unable to deactivate the consulting room.',
          );
          return throwError(() => error);
        }),
        finalize(() => this.savingSignal.set(false)),
      );
  }

  /**
   * Deletes a consulting room when permitted.
   *
   * @param command - The consulting room to delete.
   * @returns The deletion confirmation.
   */
  delete(command: DeleteConsultingRoomCommand): Observable<{ message: string }> {
    this.deletingSignal.set(true);
    this.errorSignal.set(null);

    return this.profileApi.deleteConsultingRoom(command.clinicId, command.consultingRoomId).pipe(
      tap(() => {
        this.roomsSignal.update((rooms) =>
          rooms.filter((room) => room.id !== command.consultingRoomId),
        );

        if (this.selectedRoom()?.id === command.consultingRoomId) {
          this.selectedRoomSignal.set(null);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(
          error.status === 409
            ? 'This room cannot be deleted because it has assignment history.'
            : 'Unable to delete the consulting room.',
        );
        return throwError(() => error);
      }),
      finalize(() => this.deletingSignal.set(false)),
    );
  }

  /**
   * Updates a room in the collection and selected state.
   *
   * @param updatedRoom - The updated consulting room.
   */
  private replaceRoom(updatedRoom: ConsultingRoom): void {
    this.roomsSignal.update((rooms) =>
      rooms.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)),
    );

    if (this.selectedRoom()?.id === updatedRoom.id) {
      this.selectedRoomSignal.set(updatedRoom);
    }
  }

  /**
   * Clears the current error message.
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Clears all consulting room state.
   */
  clear(): void {
    this.roomsSignal.set([]);
    this.selectedRoomSignal.set(null);

    this.loadingRoomsSignal.set(false);
    this.loadingRoomSignal.set(false);
    this.savingSignal.set(false);
    this.deletingSignal.set(false);

    this.errorSignal.set(null);
    this.notFoundSignal.set(false);
  }
}

