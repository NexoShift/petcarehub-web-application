import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';

/**
 * Dueño: tratamientos y recetas de sus mascotas (menú "Tratamientos"), juntando lo indicado en
 * todas sus consultas no canceladas. Arriba lo vigente hoy; abajo lo anterior.
 */
@Component({
  selector: 'app-owner-treatments',
  imports: [DatePipe, RouterLink, MatProgressSpinnerModule, TranslatePipe, Icon, PetAvatar],
  templateUrl: './owner-treatments.html',
  styleUrls: ['../consultation-list/consultation-list.css', './owner-treatments.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerTreatments implements OnInit {
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

  protected readonly today = new Date().toLocaleDateString('en-CA');

  private readonly consultations = computed(() =>
    this.store
      .petConsultations()
      .filter(c => c.status !== ConsultationStatus.Cancelled)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  /** Cada tratamiento con la consulta de la que salió. */
  private readonly treatments = computed(() =>
    this.consultations().flatMap(c => c.treatments.map(t => ({ treatment: t, consultation: c }))),
  );

  protected readonly current = computed(() => this.treatments().filter(x => x.treatment.isCurrentOn(this.today)));
  protected readonly past = computed(() => this.treatments().filter(x => !x.treatment.isCurrentOn(this.today)));
  protected readonly prescriptions = computed(() =>
    this.consultations()
      .flatMap(c => c.prescriptions.map(p => ({ prescription: p, consultation: c })))
      .sort((a, b) => b.prescription.issuedAt.getTime() - a.prescription.issuedAt.getTime()),
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
