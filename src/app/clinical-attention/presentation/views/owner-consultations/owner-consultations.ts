import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { ConsultationStatusChip } from '../../components/consultation-status-chip/consultation-status-chip';

/**
 * Dueño: consultas de sus mascotas (solo lectura). Mismo diseño que la lista del veterinario,
 * pero a la izquierda van las mascotas del dueño (Profiles) en vez de los pacientes de la clínica.
 */
@Component({
  selector: 'app-owner-consultations',
  imports: [DatePipe, RouterLink, MatProgressSpinnerModule, TranslatePipe, ConsultationStatusChip, Icon, PetAvatar],
  templateUrl: './owner-consultations.html',
  styleUrl: '../consultation-list/consultation-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerConsultations implements OnInit {
  /** Query param ?petId= (enlace desde el detalle de la mascota). */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  protected readonly pets = signal<Pet[]>([]);
  protected readonly petsLoading = signal(true);
  protected readonly shownPetId = signal<number | null>(null);
  protected readonly selectedPet = computed(
    () => this.pets().find(p => p.id === this.shownPetId()) ?? null,
  );

  ngOnInit(): void {
    this.store.clearError();
    const user = this.iam.currentUser();
    if (!user) {
      this.petsLoading.set(false);
      return;
    }
    this.profiles.getPetOwnerByUserId(user.id).subscribe({
      next: owner =>
        this.profiles.getPetsByOwnerId(owner.id).subscribe({
          next: pets => {
            this.pets.set(pets);
            this.petsLoading.set(false);
            const wanted = Number(this.petId());
            const first = pets.find(p => p.id === wanted) ?? pets[0];
            if (first) void this.select(first.id);
          },
          error: () => this.petsLoading.set(false),
        }),
      error: () => this.petsLoading.set(false),
    });
  }

  protected async select(petId: number): Promise<void> {
    this.shownPetId.set(petId);
    await this.store.loadByPet(petId);
  }
}
