import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';
import { RadiographFindings } from '../radiograph-findings/radiograph-findings';

/**
 * Hallazgos del modelo.
 * - Piel: lista con nombre, confianza y explicación sencilla.
 * - Radiografía: tabla de porcentajes por hallazgo (RadiographFindings), sin recuadros.
 * audience cambia el tono: el dueño ve la explicación; el vet ve si está ubicado en la imagen.
 */
@Component({
  selector: 'app-findings-panel',
  imports: [TranslatePipe, Icon, FindingLabelPipe, RadiographFindings],
  templateUrl: './findings-panel.html',
  styleUrl: './findings-panel.css',
})
export class FindingsPanel {
  readonly analysis = input.required<VisionAnalysis>();
  readonly audience = input<'owner' | 'vet'>('owner');

  protected readonly findings = computed(() => this.analysis().sortedFindings);
}
