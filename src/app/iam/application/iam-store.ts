import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AccountType } from '../domain/model/account-type';
import { User } from '../domain/model/user-entity';
import { IamApi } from '../infrastructure/iam.api';
import { TokenStorage } from '../infrastructure/token.storage';
import { UserAssembler } from '../infrastructure/user.assembler';

/** Estado de la sesión y casos de uso de IAM. Las vistas solo hablan con esta clase. */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly api = inject(IamApi);
  private readonly tokens = inject(TokenStorage);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isSignedIn = computed(
    () => this.tokens.token() !== null && this._currentUser() !== null,
  );

  signIn(email: string, password: string): Observable<User> {
    return this.api.signIn({ email, password }).pipe(
      tap((r) => this.tokens.save(r.token)),
      map((r) => UserAssembler.fromAuthenticatedResponse(r)),
      tap((user) => this._currentUser.set(user)),
    );
  }

  signUp(email: string, password: string, accountType: AccountType): Observable<User> {
    return this.api
      .signUp({ email, password, accountType })
      .pipe(map((r) => UserAssembler.fromUserResponse(r)));
  }

  /** Al recargar la página, recupera el usuario si hay un token guardado. */
  restoreSession(): Observable<User | null> {
    if (!this.tokens.token()) return of(null);
    return this.api.me().pipe(
      map((r) => UserAssembler.fromUserResponse(r)),
      tap((user) => this._currentUser.set(user)),
      catchError(() => {
        this.signOut();
        return of(null);
      }),
    );
  }

  signOut(): void {
    this.tokens.clear();
    this._currentUser.set(null);
  }
}
