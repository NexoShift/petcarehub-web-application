import { Injectable, signal } from '@angular/core';

const KEY = 'petcarehub.token';

/** Único lugar que sabe dónde vive el JWT. */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly _token = signal<string | null>(localStorage.getItem(KEY));
  readonly token = this._token.asReadonly();

  save(token: string): void {
    localStorage.setItem(KEY, token);
    this._token.set(token);
  }

  clear(): void {
    localStorage.removeItem(KEY);
    this._token.set(null);
  }
}
