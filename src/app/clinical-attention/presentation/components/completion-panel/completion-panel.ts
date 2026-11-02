import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import {
  ClinicalConsultation,
  PendingItem,
} from '../../../domain/model/clinical-consultation.entity';

const REQUIREMENTS: readonly PendingItem[] = [
  'anamnesis',
  'physiologicalAssessment',
  'primaryDiagnosis',
];

/** Phase 6 (MW-26): checks the minimum clinical record and completes the consultation. */
@Component({
  selector: 'app-completion-panel',
  imports: [MatButtonModule, MatCardModule, TranslatePipe, Icon],
  templateUrl: './completion-panel.html',
  styleUrls: ['../../clinical-attention.css', './completion-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionPanel {
  readonly consultation = input.required<ClinicalConsultation>();
  readonly saving = input(false);
  readonly completed = output<void>();

  protected readonly requirements = REQUIREMENTS;
  protected readonly pending = computed(() => this.consultation().pendingItems);
}
