import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../components/icon/icon';

/** Página temporal para los enlaces del menú que todavía no tienen pantalla. */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink, Icon, TranslatePipe],
  template: `
    <section class="soon">
      <span class="soon-icon"><app-icon name="paw" [size]="28" /></span>
      <h1>{{ 'comingSoon.title' | translate }}</h1>
      <p>{{ 'comingSoon.text' | translate }}</p>
      <a class="btn btn-primary" routerLink="/home">{{ 'comingSoon.goHome' | translate }}</a>
    </section>
  `,
  styles: `
    .soon { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 16px; text-align: center; }
    .soon-icon { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 20px; background: #E6F9F8; color: var(--color-accent); }
    h1 { margin: 8px 0 0; color: var(--color-primary); font-size: 24px; }
    p { margin: 0; max-width: 420px; color: var(--color-text-muted); }
    .btn { display: inline-flex; align-items: center; margin-top: 8px; text-decoration: none; }
  `,
})
export class ComingSoon {}
