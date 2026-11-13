import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Traduce la clase cruda del modelo ("efusion_pleural") con aiVision.labels.*.
 * Si el modelo devuelve una clase que todavía no está en los JSON, la muestra legible
 * ("Efusion pleural") en vez de la clave. Es impura para reaccionar al cambio de idioma.
 */
@Pipe({ name: 'findingLabel', pure: false })
export class FindingLabelPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(label: string | null | undefined, group: 'labels' | 'descriptions' = 'labels'): string {
    if (!label) return '';
    const key = `aiVision.${group}.${label.toLowerCase()}`;
    const text = this.translate.instant(key);
    if (text && text !== key) return text;
    if (group === 'descriptions') return '';
    const plain = label.replace(/[_-]+/g, ' ').trim();
    return plain.charAt(0).toUpperCase() + plain.slice(1);
  }
}
