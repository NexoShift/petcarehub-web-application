import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam';
import { ProfileApi } from '../../../../profiles/infrastructure/profile-api';
import { ClinicalExamsStore } from '../../../application/clinical-exams.store';
import { ExamStatus } from '../../../domain/enums/exam-status.enum';
import { ExamStatusChip } from '../../components/exam-status-chip/exam-status-chip';
import { EXAM_TYPE_ICONS } from '../../exam-type-icon';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

/**
 * Laboratorio: lista de trabajo de los exámenes de la clínica (reemplaza al Excel de pendientes).
 * Los exámenes se solicitan desde una consulta en curso; aquí se siguen hasta completarlos.
 */
@Component({
  selector: 'app-exam-worklist',
  imports: [
    DatePipe,
    RouterLink,
    MatProgressSpinnerModule,
    TranslatePipe,
    ExamStatusChip,
    Icon,
  ],
  templateUrl: './exam-worklist.html',
  styleUrl: '../clinical-exams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamWorklist implements OnInit {
  protected readonly store = inject(ClinicalExamsStore);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileApi);

  /** '' = todos; los pendientes (solicitados) se muestran primero por defecto. */
  protected readonly filters: (ExamStatus | '')[] = [
    ExamStatus.Requested,
    ExamStatus.InProcess,
    ExamStatus.Completed,
    ExamStatus.Cancelled,
    '',
  ];
  protected readonly filter = signal<ExamStatus | ''>(ExamStatus.Requested);
  protected readonly typeIcons = EXAM_TYPE_ICONS;
  private readonly petNames = signal<Map<number, string>>(new Map());

  protected readonly rows = computed(() =>
    this.store.clinicExams().map((exam) => ({
      exam,
      petName: this.petNames().get(exam.petId) ?? `#${exam.petId}`,
    })),
  );

  ngOnInit(): void {
    this.store.clearError();
    void this.load();
    this.loadPetNames();
  }

  protected changeFilter(value: ExamStatus | ''): void {
    this.filter.set(value);
    void this.load();
  }

  private load(): Promise<boolean> {
    return this.store.loadClinicExams(this.filter() || null);
  }

  /** Nombres de los pacientes de la clínica (Profiles) para mostrarlos en la tabla. */
  private loadPetNames(): void {
    const user = this.iam.currentUser();
    if (!user) return;
    this.profiles.getClinicByAccountId(user.accountId).subscribe({
      next: (clinic) =>
        this.profiles.getPatientsByClinicId(clinic.id).subscribe({
          next: (pets) => this.petNames.set(new Map(pets.map((pet) => [pet.id, pet.name]))),
          error: () => undefined,
        }),
      error: () => undefined,
    });
  }
}
