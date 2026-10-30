import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../icon/icon';
import { Kpi } from '../../../domain/model/dashboard/vet-dashboard';

/**
 * Tarjeta de indicador del panel del veterinario: título, número grande y una pista.
 * label, unit y hint pueden ser claves de i18n; si no lo son, | translate muestra el texto tal cual.
 */
@Component({
  selector: 'app-kpi-card',
  imports: [Icon, TranslatePipe],
  template: `
    <div class="top">
      <span class="label">{{ kpi().label | translate }}</span>
      <span class="icon"><app-icon [name]="kpi().icon" [size]="16" /></span>
    </div>
    <p class="value"><strong>{{ kpi().value }}</strong> {{ kpi().unit | translate }}</p>
    <span class="hint">{{ kpi().hint | translate }}</span>
  `,
  host: { '[class.highlight]': 'kpi().highlight' },
  styles: `
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: clamp(16px, 1.2vw, 22px);
      border: 1px solid #E8ECF1;
      border-radius: 16px;
      background: #fff;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    :host(:hover) { transform: translateY(-2px); box-shadow: 0 12px 24px -14px rgba(3, 43, 89, 0.3); }
    /* La tarjeta destacada lleva una franja turquesa arriba */
    :host(.highlight)::before { content: ''; position: absolute; inset: 0 0 auto; height: 3px; background: #0BC3BD; }
    .top { display: flex; align-items: center; justify-content: space-between; }
    .label { color: #667085; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: #EEF4FA; color: #023A65; }
    :host(.highlight) .icon { background: #E6F9F8; color: #079A95; }
    .value { margin: 4px 0 0; color: #667085; font-size: 13px; }
    .value strong { margin-right: 4px; color: #032B59; font-size: clamp(26px, 2vw, 34px); font-weight: 700; letter-spacing: -0.02em; }
    .hint { align-self: flex-start; padding: 3px 8px; border-radius: 999px; background: #F2F4F7; color: #475467; font-size: 11px; font-weight: 500; }
    :host(.highlight) .hint { background: #E6F9F8; color: #067A76; }
  `,
})
export class KpiCard {
  readonly kpi = input.required<Kpi>();
}
