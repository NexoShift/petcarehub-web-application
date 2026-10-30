import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

/** Idiomas que tiene la app. Cada uno necesita su archivo public/i18n/<código>.json. */
export type Language = 'es' | 'en';

export const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'en', label: 'EN', name: 'English' },
];

const KEY = 'petcarehub.lang';

/**
 * Idioma actual de la app. Envuelve a TranslateService de ngx-translate y además:
 * - recuerda el idioma elegido en localStorage (sigue igual al recargar),
 * - cambia <html lang="..."> (lectores de pantalla y buscadores),
 * - expone el "locale" para formatear fechas (es-PE o en-US).
 */
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly translate = inject(TranslateService);

  private readonly _current = signal<Language>(readSaved());
  readonly current = this._current.asReadonly();
  readonly locale = computed(() => (this._current() === 'en' ? 'en-US' : 'es-PE'));

  /** Se llama una vez al arrancar (app.config.ts) para cargar el JSON antes de pintar la pantalla. */
  init(): Observable<unknown> {
    document.documentElement.lang = this._current();
    return this.translate.use(this._current());
  }

  use(language: Language): void {
    this._current.set(language);
    this.translate.use(language);
    document.documentElement.lang = language;
    try { localStorage.setItem(KEY, language); } catch { /* modo privado: no pasa nada */ }
  }
}

/** Idioma guardado; si no hay, español. */
function readSaved(): Language {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}
