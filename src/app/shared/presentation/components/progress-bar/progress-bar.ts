import { Component, input } from '@angular/core';

/** Barra de progreso que se llena con animación al aparecer. value va de 0 a 100. */
@Component({
  selector: 'app-progress-bar',
  template: `<span class="fill" [style.width.%]="value()"></span>`,
  host: { role: 'progressbar', '[attr.aria-valuenow]': 'value()', 'aria-valuemin': '0', 'aria-valuemax': '100' },
  styles: `
    :host { display: block; height: 6px; border-radius: 999px; background: #E6ECF2; overflow: hidden; }
    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #0BC3BD, #09A8A3);
      animation: grow 1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
      transform-origin: left;
    }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  `,
})
export class ProgressBar {
  readonly value = input(0);
}
