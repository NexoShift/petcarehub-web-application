import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsultationStatus } from '../../../domain/enums/consultation-status.enum';

@Component({
  selector: 'app-consultation-status-chip',
  imports: [MatChipsModule, TranslatePipe],
  templateUrl: './consultation-status-chip.html',
  styleUrl: './consultation-status-chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultationStatusChip {
  readonly status = input.required<ConsultationStatus>();
  protected readonly cssClass = computed(() => this.status().toLowerCase().replace('_', '-'));
}
