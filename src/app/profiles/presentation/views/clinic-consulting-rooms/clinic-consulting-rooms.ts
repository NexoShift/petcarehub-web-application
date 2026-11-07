import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';
import { ConsultingRoomStore } from '../../../application/consulting-room.store';
import { ConsultingRoomAssignmentStore } from '../../../application/consulting-room-assignment.store';
import { VeterinarianStore } from '../../../application/veterinarian.store';
import { ConsultingRoom } from '../../../domain/model/consulting-room.entity';
import { ConsultingRoomAssignment } from '../../../domain/model/consulting-room-assignment.entity';
import { Veterinarian } from '../../../domain/model/veterinarian.entity';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

/** A room together with its current veterinarian, ready for the template. */
interface RoomView {
  room: ConsultingRoom;
  assignment: ConsultingRoomAssignment | null;
  veterinarian: Veterinarian | null;
}

/**
 * Consulting rooms of the administrator's clinic: create, edit, activate or
 * deactivate, delete, and assign or unassign the veterinarian on duty.
 */
@Component({
  selector: 'app-clinic-consulting-rooms',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './clinic-consulting-rooms.html',
  styleUrl: './clinic-consulting-rooms.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicConsultingRooms {
  private readonly iamStore = inject(IamStore);
  protected readonly clinicStore = inject(ClinicStore);
  protected readonly roomStore = inject(ConsultingRoomStore);
  protected readonly assignmentStore = inject(ConsultingRoomAssignmentStore);
  private readonly veterinarianStore = inject(VeterinarianStore);
  private readonly fb = inject(FormBuilder);

  protected readonly clinic = this.clinicStore.clinic;
  protected readonly veterinarians = this.veterinarianStore.veterinarians;

  /** null = form closed, 0 = new room, any other id = editing that room. */
  protected readonly editingId = signal<number | null>(null);
  protected readonly confirmDeleteId = signal<number | null>(null);
  /** Veterinarian picked in each room's selector, by room id. */
  protected readonly pickedVet = signal<Record<number, number | null>>({});
  /** i18n key of the last error, shown at the top of the page. */
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(250)]],
  });

  protected readonly rooms = computed<RoomView[]>(() => {
    const active = this.assignmentStore.activeAssignments();
    const vets = this.veterinarians();
    return [...this.roomStore.rooms()]
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
      .map((room) => {
        const assignment = active.find((a) => a.consultingRoomId === room.id) ?? null;
        const veterinarian = assignment
          ? (vets.find((v) => v.id === assignment.veterinarianId) ?? null)
          : null;
        return { room, assignment, veterinarian };
      });
  });

  protected readonly totalCount = computed(() => this.roomStore.roomCount());
  protected readonly activeCount = computed(() => this.roomStore.activeRoomCount());
  protected readonly staffedCount = computed(() => this.rooms().filter((r) => r.assignment).length);

  /** Vets that are not on duty in another room right now. */
  protected readonly freeVeterinarians = computed(() => {
    const busy = new Set(this.assignmentStore.activeAssignments().map((a) => a.veterinarianId));
    return this.veterinarians().filter((v) => !busy.has(v.id));
  });

  constructor() {
    effect(() => {
      const user = this.iamStore.currentUser();
      if (user && user.hasRole('ROLE_CLINIC_ADMIN')) {
        this.clinicStore.loadByAccountId(user.accountId);
      }
    });

    effect(() => {
      const user = this.iamStore.currentUser();
      const clinic = this.clinic();
      if (!user || !clinic || clinic.accountId !== user.accountId) return;
      this.roomStore.loadByClinicId(clinic.id);
      this.assignmentStore.loadByClinicId(clinic.id);
      this.veterinarianStore.loadByClinicId(clinic.id);
    });
  }

  // ----- Formulario -----

  protected openCreate(): void {
    this.form.reset({ name: '', description: '' });
    this.editingId.set(0);
    this.errorKey.set(null);
  }

  protected openEdit(room: ConsultingRoom): void {
    this.form.reset({ name: room.name, description: room.description ?? '' });
    this.editingId.set(room.id);
    this.errorKey.set(null);
  }

  protected closeForm(): void {
    this.editingId.set(null);
  }

  protected save(): void {
    const clinic = this.clinic();
    const editingId = this.editingId();
    if (!clinic || editingId === null) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    const description = this.form.controls.description.value.trim() || null;

    const request$ =
      editingId === 0
        ? this.roomStore.create({ clinicId: clinic.id, name, description })
        : this.roomStore.update({ clinicId: clinic.id, consultingRoomId: editingId, name, description });

    request$.subscribe({
      next: () => this.editingId.set(null),
      error: (e: HttpErrorResponse) =>
        this.errorKey.set(e.status === 409 ? 'profiles.consultingRooms.errors.duplicate' : 'profiles.consultingRooms.errors.save'),
    });
  }

  // ----- Estado y eliminación -----

  protected toggleActive(view: RoomView): void {
    const clinic = this.clinic();
    if (!clinic) return;
    const command = { clinicId: clinic.id, consultingRoomId: view.room.id };
    const request$ = view.room.active
      ? this.roomStore.deactivate(command)
      : this.roomStore.activate(command);
    this.errorKey.set(null);
    request$.subscribe({
      error: (e: HttpErrorResponse) =>
        this.errorKey.set(
          e.status === 409 ? 'profiles.consultingRooms.errors.hasVet' : 'profiles.consultingRooms.errors.save',
        ),
    });
  }

  protected askDelete(roomId: number): void {
    this.confirmDeleteId.set(roomId);
  }

  protected cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  protected remove(roomId: number): void {
    const clinic = this.clinic();
    if (!clinic) return;
    this.errorKey.set(null);
    this.roomStore.delete({ clinicId: clinic.id, consultingRoomId: roomId }).subscribe({
      next: () => this.confirmDeleteId.set(null),
      error: (e: HttpErrorResponse) => {
        this.confirmDeleteId.set(null);
        this.errorKey.set(
          e.status === 409 ? 'profiles.consultingRooms.errors.hasHistory' : 'profiles.consultingRooms.errors.delete',
        );
      },
    });
  }

  // ----- Veterinario a cargo -----

  protected pick(roomId: number, vetId: number | null): void {
    this.pickedVet.update((m) => ({ ...m, [roomId]: vetId }));
  }

  protected assign(roomId: number): void {
    const clinic = this.clinic();
    const vetId = this.pickedVet()[roomId];
    if (!clinic || !vetId) return;
    this.errorKey.set(null);
    this.assignmentStore
      .assign({ clinicId: clinic.id, consultingRoomId: roomId, veterinarianId: vetId })
      .subscribe({
        next: () => this.pick(roomId, null),
        error: () => this.errorKey.set('profiles.consultingRooms.errors.assign'),
      });
  }

  protected unassign(assignment: ConsultingRoomAssignment): void {
    const clinic = this.clinic();
    if (!clinic) return;
    this.errorKey.set(null);
    this.assignmentStore.unassign({ clinicId: clinic.id, assignmentId: assignment.id }).subscribe({
      error: () => this.errorKey.set('profiles.consultingRooms.errors.unassign'),
    });
  }

  protected initials(vet: Veterinarian): string {
    return ((vet.firstName.charAt(0) + vet.lastName.charAt(0)).toUpperCase() || 'VT');
  }
}
