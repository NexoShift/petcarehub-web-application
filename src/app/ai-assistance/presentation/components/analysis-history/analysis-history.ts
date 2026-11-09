import { Component, effect, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageStore } from '../../../../shared/application/language.store';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { VisionStore } from '../../../application/vision.store';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';
import { LocalDatePipe } from '../../pipes/local-date.pipe';

/** Tarjetas con los análisis anteriores de la mascota (miniatura, fecha, tipo y hallazgo principal). */
@Component({
  selector: 'app-analysis-history',
  imports: [TranslatePipe, LocalDatePipe, Icon, FindingLabelPipe],
  templateUrl: './analysis-history.html',
  styleUrl: './analysis-history.css',
})
export class AnalysisHistory {
  readonly analyses = input.required<VisionAnalysis[]>();
  readonly selectedId = input<number | null>(null);
  /** Muestra quién lo subió (el vet ve también lo que mandó el dueño). */
  readonly showRequester = input(false);
  readonly selected = output<VisionAnalysis>();

  protected readonly store = inject(VisionStore);
  protected readonly language = inject(LanguageStore);

  constructor() {
    // Pide las miniaturas de lo que se muestra (una sola vez por análisis)
    effect(() => this.analyses().slice(0, 12).forEach(a => this.store.ensureImage(a)));
  }
}
