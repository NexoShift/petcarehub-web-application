import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageStore } from '../../../../shared/application/language.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { IamStore } from '../../../application/iam.store';
import { AccountType } from '../../../domain/model/account-type';
import { GoogleIdentityService } from '../../../infrastructure/google-identity.service';

/** Adónde va una cuenta recién creada: a completar su perfil (igual que el registro normal). */
const ONBOARDING_ROUTES: Record<AccountType, string> = {
  PET_OWNER: '/profiles/pet-owner/complete',
  CLINIC: '/profiles/clinic/complete',
};

/**
 * Botón "Continuar con Google" (Google Identity Services). Manda el idToken al backend y entra
 * con el mismo JWT del login normal. Si el correo es nuevo y no sabemos el tipo de cuenta
 * (422 ACCOUNT_TYPE_REQUIRED), pregunta "¿Dueño o clínica?" y reenvía el mismo token.
 */
@Component({
  selector: 'app-google-sign-in-button',
  imports: [TranslatePipe],
  templateUrl: './google-sign-in-button.html',
  styleUrl: './google-sign-in-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleSignInButton {
  /** En el registro ya se eligió el tipo de cuenta; en el login no. */
  readonly accountType = input<AccountType | null>(null);
  readonly mode = input<'signin' | 'signup'>('signin');

  private readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageStore);
  protected readonly google = inject(GoogleIdentityService);

  private readonly host = viewChild<ElementRef<HTMLElement>>('googleHost');

  protected readonly loading = signal(false);
  protected readonly unavailable = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Token guardado mientras el usuario elige si es dueño o clínica. */
  protected readonly pendingToken = signal<string | null>(null);

  constructor() {
    effect(() => {
      const el = this.host()?.nativeElement;
      const locale = this.language.current();
      if (!el || !this.google.enabled) return;
      this.google
        .renderButton(el, (token) => this.send(token, this.accountType() ?? undefined), {
          text: this.mode() === 'signup' ? 'signup_with' : 'continue_with',
          locale,
        })
        .catch(() => this.unavailable.set(true));
    });
  }

  protected choose(type: AccountType): void {
    const token = this.pendingToken();
    if (token) this.send(token, type);
  }

  private send(idToken: string, accountType?: AccountType): void {
    this.loading.set(true);
    this.error.set(null);
    this.store.googleSignIn(idToken, accountType).subscribe({
      next: ({ user, created }) => {
        this.pendingToken.set(null);
        const target = created
          ? ONBOARDING_ROUTES[user.accountType]
          : user.mustChangePassword ? '/change-password' : '/home';
        void this.router.navigateByUrl(target);
      },
      error: (e: ApiError) => {
        this.loading.set(false);
        if (e.status === 422) {
          this.pendingToken.set(idToken);
          return;
        }
        this.pendingToken.set(null);
        this.error.set(
          e.status === 401 ? 'auth.google.invalid'
            : e.status === 503 ? 'auth.google.notConfigured'
            : 'auth.google.failed',
        );
      },
    });
  }
}
