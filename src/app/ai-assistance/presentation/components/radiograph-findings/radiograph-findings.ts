import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { VisionAnalysis } from '../../../domain/model/vision-analysis.entity';
import { FindingLabelPipe } from '../../pipes/finding-label.pipe';

/**
 * Resultado de una radiografía: tabla de porcentajes por hallazgo, sin recuadros.
 * El modelo es multietiqueta: cada clase tiene su propio porcentaje y no suman 100.
 * - 50 % o más: "Probable". Entre 20 y 49 %: "Posible". Bajo 20 % el backend no lo guarda.
 * - Si solo vino "sin hallazgos" (no_finding) se muestra un aviso en lugar de la tabla.
 * - Neumotórax y megaesófago se marcan como "poca fiabilidad" (pocos casos de entrenamiento).
 */
@Component({
  selector: 'app-radiograph-findings',
  imports: [TranslatePipe, Icon, FindingLabelPipe],
  templateUrl: './radiograph-findings.html',
  styleUrl: './radiograph-findings.css',
})
export class RadiographFindings {
  readonly analysis = input.required<VisionAnalysis>();

  protected readonly rows = computed(() => this.analysis().sortedFindings);
  protected readonly normal = computed(() => this.analysis().isNormalRadiograph);
  protected readonly normalPercentage = computed(() => this.analysis().topFinding?.confidencePercentage ?? 0);
  protected readonly probableCount = computed(() => this.rows().filter(f => f.probable).length);
  protected readonly hasLowReliability = computed(() => this.rows().some(f => f.lowReliability));
}
