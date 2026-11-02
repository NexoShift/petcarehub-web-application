import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';
import { ClinicalConsultation } from '../../../domain/model/clinical-consultation.entity';
import { CONSULTATION_PHASES, ConsultationPhaseId } from './consultation-phase';

@Component({
  selector: 'app-consultation-phases',
  imports: [Icon, TranslatePipe],
  templateUrl: './consultation-phases.html',
  styleUrl: './consultation-phases.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationPhases {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly active = input.required<ConsultationPhaseId>();
  readonly selected = output<ConsultationPhaseId>();

  protected readonly items = computed(() =>
    CONSULTATION_PHASES.map((phase) => ({ ...phase, done: this.isDone(phase.id) })),
  );

  private isDone(phase: ConsultationPhaseId): boolean {
    const consultation = this.consultation();
    switch (phase) {
      case 'anamnesis':
        return consultation.anamnesis !== null;
      case 'assessment':
        return consultation.physiologicalAssessments.length > 0;
      case 'diagnosis':
        return consultation.primaryDiagnosis !== null;
      case 'completion':
        return consultation.status === ConsultationStatus.Completed;
      default:
        return false;
    }
  }
}
