import { Component, inject } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { LANGUAGES, Language, LanguageStore } from '../../../application/language.store';

/**
 * Botones ES | EN para cambiar el idioma. Va en la toolbar del Shell y en las pantallas de acceso.
 * Con class="dark" se ve bien sobre el fondo navy (login, recuperar contraseña).
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleGroup, MatButtonToggle, TranslatePipe],
  template: `
    <mat-button-toggle-group
      [value]="language.current()"
      (change)="use($event.value)"
      hideSingleSelectionIndicator=""
      [attr.aria-label]="'language.ariaLabel' | translate"
      name="language">
      @for (lang of languages; track lang.code) {
        <mat-button-toggle [value]="lang.code" [aria-label]="lang.name">{{ lang.label }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
  styles: `
    :host { display: inline-flex; }
    mat-button-toggle-group { font-size: 12px; font-weight: 600; }
    /* Sobre fondo oscuro el botón no seleccionado va blanco translúcido */
    :host(.dark) mat-button-toggle-group { border-color: rgba(255, 255, 255, 0.35); background: rgba(255, 255, 255, 0.1); }
    :host(.dark) mat-button-toggle:not(.mat-button-toggle-checked) { color: #fff; background: transparent; }
    :host(.dark) .mat-button-toggle-checked { background: #fff; color: var(--color-primary); }
  `,
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageStore);
  protected readonly languages = LANGUAGES;

  protected use(code: Language): void {
    this.language.use(code);
  }
}
