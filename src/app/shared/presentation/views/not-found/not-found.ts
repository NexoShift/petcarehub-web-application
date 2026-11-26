import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../components/icon/icon';

/** Página para las direcciones que no existen (ruta ** del Shell). */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon, TranslatePipe],
  template: `
    <section class="not-found">
      <span class="not-found-icon"><app-icon name="search" [size]="28" /></span>
      <h1>{{ 'notFound.title' | translate }}</h1>
      <p>{{ 'notFound.text' | translate }}</p>
      <a class="btn btn-primary" routerLink="/home">{{ 'notFound.goHome' | translate }}</a>
    </section>
  `,
  styles: `
    .not-found { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 16px; text-align: center; }
    .not-found-icon { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 20px; background: #E6F9F8; color: var(--color-accent); }
    h1 { margin: 8px 0 0; color: var(--color-primary); font-size: 24px; }
    p { margin: 0; max-width: 420px; color: var(--color-text-muted); }
    .btn { display: inline-flex; align-items: center; margin-top: 8px; text-decoration: none; }
  `,
})
export class NotFound {}
