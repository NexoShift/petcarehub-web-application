import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClinicalExamsStore } from '../../../../clinical-exams/application/clinical-exams.store';
import { ExamStatusChip } from '../../../../clinical-exams/presentation/components/exam-status-chip/exam-status-chip';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';
import { ClinicalAttentionStore } from '../../../application/clinical-attention.store';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { ConsultationStatusChip } from '../../components/consultation-status-chip/consultation-status-chip';

interface Names {
  pet?: string;
  veterinarian?: string;
  clinic?: string;
}

/**
 * Dueño: detalle de una consulta de su mascota, solo lectura. Muestra lo que registró el
 * veterinario y los exámenes de la consulta (con resultados ya validados).
 */
@Component({
  selector: 'app-owner-consultation-detail',
  imports: [DatePipe, RouterLink, MatProgressSpinnerModule, TranslatePipe, ConsultationStatusChip, ExamStatusChip, Icon, PetAvatar],
  templateUrl: './owner-consultation-detail.html',
  styleUrl: './owner-consultation-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerConsultationDetail {
  readonly consultationId = input.required<string>();

  protected readonly store = inject(ClinicalAttentionStore);
  protected readonly exams = inject(ClinicalExamsStore);
  private readonly profiles = inject(ProfileApi);
  protected readonly names = signal<Names>({});

  constructor() {
    effect(() => {
      const id = Number(this.consultationId());
      untracked(async () => {
        this.names.set({});
        if (await this.store.load(id)) {
          const consultation = this.store.consultation();
          if (consultation) {
            this.loadNames(consultation);
            void this.exams.loadByConsultation(consultation.id);
          }
        }
      });
    });
  }

  private loadNames(c: ClinicalConsultation): void {
    const set = (patch: Names) => this.names.update(n => ({ ...n, ...patch }));
    this.profiles.getPetById(c.petId).subscribe({ next: p => set({ pet: p.name }), error: () => undefined });
    this.profiles.getVeterinarianById(c.veterinarianId).subscribe({
      next: v => set({ veterinarian: `${v.firstName} ${v.lastName}` }),
      error: () => undefined,
    });
    this.profiles.getClinicById(c.clinicId).subscribe({ next: cl => set({ clinic: cl.name }), error: () => undefined });
  }
}
