import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam';
import { Pet } from '../../../../profiles/domain/model/pet.entity';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { ClinicalExamsStore } from '../../../application/clinical-exams.store';
import { ClinicalExam } from '../../../domain/model/clinical-exam.entity';
import { ClinicalFile } from '../../../domain/model/clinical-file.entity';
import { ClinicalFileList } from '../../components/clinical-file-list/clinical-file-list';
import { ExamStatusChip } from '../../components/exam-status-chip/exam-status-chip';
import { EXAM_TYPE_ICONS } from '../../exam-type-icon';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PetAvatar } from '../../../../shared/presentation/components/pet-avatar/pet-avatar';

/**
 * Dueño: exámenes de sus mascotas. Solo lectura. El backend solo envía el resultado cuando un
 * veterinario ya lo validó, así que aquí nunca aparece un borrador.
 */
@Component({
  selector: 'app-owner-exams',
  imports: [
    DatePipe,
    RouterLink,
    MatProgressSpinnerModule,
    TranslatePipe,
    ClinicalFileList,
    ExamStatusChip,
    Icon,
    PetAvatar,
  ],
  templateUrl: './owner-exams.html',
  styleUrls: ['../clinical-exams.css', './owner-exams.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerExams implements OnInit {
  /** Query param ?petId= (enlace desde el detalle de la mascota o de la consulta). */
  readonly petId = input<string>();

  protected readonly store = inject(ClinicalExamsStore);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  protected readonly typeIcons = EXAM_TYPE_ICONS;
  protected readonly pets = signal<Pet[]>([]);
  protected readonly petsLoading = signal(true);
  protected readonly selectedPetId = signal<number | null>(null);
  protected readonly selectedPet = computed(
    () => this.pets().find((pet) => pet.id === this.selectedPetId()) ?? null,
  );

  ngOnInit(): void {
    this.store.clearError();
    const user = this.iam.currentUser();
    if (!user) {
      this.petsLoading.set(false);
      return;
    }
    this.profiles.getPetOwnerByUserId(user.id).subscribe({
      next: (owner) =>
        this.profiles.getPetsByOwnerId(owner.id).subscribe({
          next: (pets) => {
            this.pets.set(pets);
            this.petsLoading.set(false);
            const wanted = Number(this.petId());
            const first = pets.find((pet) => pet.id === wanted) ?? pets[0];
            if (first) void this.select(first.id);
          },
          error: () => this.petsLoading.set(false),
        }),
      error: () => this.petsLoading.set(false),
    });
  }

  protected async select(petId: number): Promise<void> {
    this.selectedPetId.set(petId);
    await this.store.loadByPet(petId);
  }

  protected async download(exam: ClinicalExam, file: ClinicalFile): Promise<void> {
    const blob = await this.store.downloadFile(exam.id, file.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
