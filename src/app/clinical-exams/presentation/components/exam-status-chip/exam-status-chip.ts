import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { ExamStatus } from '../../../domain/enums/exam-status.enum';

@Component({
  selector: 'app-exam-status-chip',
  imports: [MatChipsModule, TranslatePipe],
  templateUrl: './exam-status-chip.html',
  styleUrl: './exam-status-chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamStatusChip {
  readonly status = input.required<ExamStatus>();
  protected readonly cssClass = computed(() => this.status().toLowerCase().replace('_', '-'));
}
