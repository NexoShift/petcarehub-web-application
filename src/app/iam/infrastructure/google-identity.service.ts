import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Lo mínimo de Google Identity Services (https://accounts.google.com/gsi/client) que usamos. */
interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup' }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/**
 * Carga el script de Google una sola vez y dibuja el botón oficial "Continuar con Google".
 * El callback recibe el idToken (response.credential) que se manda al backend.
 * Sin environment.googleClientId el botón no se muestra.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private loading: Promise<void> | null = null;

  readonly clientId: string = environment.googleClientId ?? '';

  get enabled(): boolean {
    return this.clientId.length > 0;
  }

  async renderButton(
    parent: HTMLElement,
    onCredential: (idToken: string) => void,
    options: { text: 'signin_with' | 'signup_with' | 'continue_with'; locale: string },
  ): Promise<void> {
    await this.load();
    const id = window.google!.accounts.id;
    id.initialize({
      client_id: this.clientId,
      ux_mode: 'popup',
      // Google llama fuera de Angular: volvemos a la zona para que la vista se actualice
      callback: (response) => this.zone.run(() => onCredential(response.credential)),
    });
    parent.replaceChildren();
    id.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: options.text,
      locale: options.locale,
      width: Math.max(200, Math.min(400, parent.clientWidth || 320)),
    });
  }

  private load(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    this.loading ??= new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.loading = null;
        reject(new Error('Google Identity Services could not be loaded'));
      };
      this.document.head.appendChild(script);
    });
    return this.loading;
  }
}
