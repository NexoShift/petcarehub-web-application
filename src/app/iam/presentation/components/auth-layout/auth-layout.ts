import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Marco de las pantallas de acceso: foto a la izquierda y formulario a la derecha.
 * variant="sign-in" (MW-01) y variant="sign-up" (MW-02) solo cambian la foto y el texto.
 * Los textos son claves de public/i18n/*.json: el pipe | translate los cambia según el idioma.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [TranslatePipe, LanguageSwitcher],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly variant = input<'sign-in' | 'sign-up'>('sign-in');

  protected readonly content = computed(() => this.variant() === 'sign-in'
    ? {
        image: 'images/login-vet.png',
        alt: 'auth.layout.signInAlt',
        claim: 'auth.layout.signInClaim',
      }
    : {
        image: 'images/register-vet.png',
        alt: 'auth.layout.signUpAlt',
        claim: 'auth.layout.signUpClaim',
      });

  protected readonly features = [
    'auth.layout.features.history',
    'auth.layout.features.ai',
    'auth.layout.features.platforms',
  ];
}
