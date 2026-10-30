import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { IamStore } from './iam';
import { authInterceptor } from './iam/infrastructure/auth.interceptor';
import { errorInterceptor } from './shared/infrastructure/error.interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { LanguageStore } from './shared/application/language.store';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAppInitializer(() => inject(IamStore).restoreSession()),
    // ngx-translate: lee public/i18n/es.json y public/i18n/en.json. Si falta una clave en inglés, usa la de español.
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      fallbackLang: 'es',
    }),
    // Antes de mostrar la app: carga el idioma guardado y recupera la sesión
    provideAppInitializer(() => firstValueFrom(inject(LanguageStore).init())),
    provideAppInitializer(() => inject(IamStore).restoreSession()),
  ],
};
