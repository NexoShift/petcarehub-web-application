import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { ConsultationStatusChip } from '../../components/consultation-status-chip/consultation-status-chip';
import { IamStore } from '../../../../iam';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Clinic } from '../../../../profiles/domain/model/clinic.entity';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';

/**
 * Consultations of a pet (MW-22). The veterinarian picks the patient from the clinic directory
 * (Profiles) and sees its consultations (Clinical Attention lists them by pet).
 */
@Component({
  selector: 'app-consultation-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ConsultationStatusChip,
    Icon,
    PetAvatar,
  ],
  templateUrl: './consultation-list.html',
  styleUrl: './consultation-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationList implements OnInit {
  /** Bound from the `petId` query parameter so the list can be linked. */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  protected readonly clinic = signal<Clinic | null>(null);
  protected readonly patients = signal<Pet[]>([]);
  protected readonly patientsLoading = signal(true);
  protected readonly query = signal('');
  protected readonly shownPetId = signal<number | null>(null);

  /** Pacientes filtrados por nombre, código o raza. */
  protected readonly visiblePatients = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.patients();
    return this.patients().filter(p =>
      [p.name, p.petCode, p.breed ?? ''].some(v => v.toLowerCase().includes(q)),
    );
  });

  protected readonly selectedPet = computed(() =>
    this.patients().find(p => p.id === this.shownPetId()) ?? null,
  );

  ngOnInit(): void {
    this.store.clearError();
    this.loadPatients();
    const petId = Number(this.petId());
    if (Number.isInteger(petId) && petId > 0) {
      void this.select(petId);
    }
  }

  protected async select(petId: number): Promise<void> {
    this.shownPetId.set(petId);
    await this.store.loadByPet(petId);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private loadPatients(): void {
    const user = this.iam.currentUser();
    if (!user) {
      this.patientsLoading.set(false);
      return;
    }
    this.profiles.getClinicByAccountId(user.accountId).subscribe({
      next: clinic => {
        this.clinic.set(clinic);
        this.profiles.getPatientsByClinicId(clinic.id).subscribe({
          next: pets => {
            this.patients.set(pets);
            this.patientsLoading.set(false);
          },
          error: () => this.patientsLoading.set(false),
        });
      },
      error: () => this.patientsLoading.set(false),
    });
  }
}
