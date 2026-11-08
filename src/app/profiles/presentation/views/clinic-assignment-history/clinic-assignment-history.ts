import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ClinicStore } from '../../../application/clinic.store';
import { ConsultingRoomStore } from '../../../application/consulting-room.store';
import { ConsultingRoomAssignmentStore } from '../../../application/consulting-room-assignment.store';
import { VeterinarianStore } from '../../../application/veterinarian.store';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

type AssignmentFilter = 'ALL' | 'ACTIVE' | 'ENDED';

/**
 * Displays consulting room assignment history.
 *
 * Supports clinic-wide and room-specific history using
 * the existing Profile API endpoints.
 */
@Component({
  selector: 'app-clinic-assignment-history',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe,
    Icon,
  ],
  templateUrl: './clinic-assignment-history.html',
  styleUrl: './clinic-assignment-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicAssignmentHistory {
  private readonly route = inject(ActivatedRoute);
  private readonly iamStore = inject(IamStore);

  protected readonly clinicStore = inject(ClinicStore);
  protected readonly roomStore = inject(ConsultingRoomStore);
  protected readonly assignmentStore = inject(ConsultingRoomAssignmentStore);
  protected readonly veterinarianStore = inject(VeterinarianStore);

  protected readonly clinic = this.clinicStore.clinic;

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  /**
   * Null means clinic-wide history.
   */
  protected readonly roomId = computed(() => {
    const rawId = this.routeParams().get('roomId');

    if (rawId === null) {
      return null;
    }

    const id = Number(rawId);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  });

  protected readonly statusFilter = signal<AssignmentFilter>('ALL');

  /**
   * Retrieves assignments from the corresponding store collection.
   */
  protected readonly assignments = computed(() => {
    const records =
      this.roomId() === null
        ? this.assignmentStore.assignments()
        : this.assignmentStore.roomAssignments();

    return [...records].sort((a, b) => Date.parse(b.assignedAt) - Date.parse(a.assignedAt));
  });

  protected readonly filteredAssignments = computed(() => {
    const filter = this.statusFilter();

    if (filter === 'ALL') {
      return this.assignments();
    }

    return this.assignments().filter((assignment) =>
      filter === 'ACTIVE' ? assignment.active : !assignment.active,
    );
  });

  protected readonly activeCount = computed(
    () => this.assignments().filter((assignment) => assignment.active).length,
  );

  protected readonly selectedRoom = computed(() => {
    const id = this.roomId();

    return id === null ? null : (this.roomStore.rooms().find((room) => room.id === id) ?? null);
  });

  protected readonly loading = computed(() =>
    this.roomId() === null
      ? this.assignmentStore.loadingAssignments()
      : this.assignmentStore.loadingRoomAssignments(),
  );

  constructor() {
    effect(() => {
      const user = this.iamStore.currentUser();

      if (user?.hasRole('ROLE_CLINIC_ADMIN')) {
        this.clinicStore.loadByAccountId(user.accountId);
      }
    });

    effect(() => {
      const user = this.iamStore.currentUser();
      const clinic = this.clinic();
      const roomId = this.roomId();

      if (
        !user ||
        !user.hasRole('ROLE_CLINIC_ADMIN') ||
        !clinic ||
        clinic.accountId !== user.accountId
      ) {
        return;
      }

      this.roomStore.loadByClinicId(clinic.id);
      this.veterinarianStore.loadByClinicId(clinic.id);

      if (roomId === null) {
        this.assignmentStore.loadByClinicId(clinic.id);
      } else {
        this.assignmentStore.loadByConsultingRoomId(clinic.id, roomId);
      }
    });
  }

  /**
   * Resolves a room name using previously loaded clinic rooms.
   */
  protected roomName(roomId: number): string {
    return this.roomStore.rooms().find((room) => room.id === roomId)?.name ?? `#${roomId}`;
  }

  /**
   * Resolves a veterinarian's name using clinic profiles.
   */
  protected veterinarianName(veterinarianId: number): string {
    const veterinarian = this.veterinarianStore
      .veterinarians()
      .find((item) => item.id === veterinarianId);

    return veterinarian
      ? `${veterinarian.firstName} ${veterinarian.lastName}`
      : `#${veterinarianId}`;
  }

  /**
   * Refreshes the currently displayed assignment history.
   */
  protected refresh(): void {
    const user = this.iamStore.currentUser();
    const clinic = this.clinic();

    if (
      !user ||
      !user.hasRole('ROLE_CLINIC_ADMIN') ||
      !clinic ||
      clinic.accountId !== user.accountId
    ) {
      return;
    }

    const roomId = this.roomId();

    if (roomId === null) {
      this.assignmentStore.loadByClinicId(clinic.id);
    } else {
      this.assignmentStore.loadByConsultingRoomId(clinic.id, roomId);
    }
  }

  protected changeFilter(value: AssignmentFilter): void {
    this.statusFilter.set(value);
  }
}
