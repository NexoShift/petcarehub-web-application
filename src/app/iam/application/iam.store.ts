import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { AccountType } from '../domain/model/account-type';
import { User } from '../domain/model/user.entity';
import { IamApi } from '../infrastructure/iam.api';
import { TokenStorage } from '../infrastructure/token.storage';
import { UserAssembler } from '../infrastructure/user.assembler';
import { CreateMemberUserCommand } from '../domain/model/create-member-user.command';
import { CreateMemberUserRequest } from '../infrastructure/resources/create-member-user.request';
import { finalize } from 'rxjs';
import { AccountUser } from '../domain/model/account-user.entity';

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

  // Account user directory state
  private readonly accountUsersSignal = signal<AccountUser[]>([]);
  private readonly loadingAccountUsersSignal = signal(false);
  private readonly accountUsersErrorSignal = signal(false);

  readonly accountUsers = this.accountUsersSignal.asReadonly();
  readonly loadingAccountUsers = this.loadingAccountUsersSignal.asReadonly();
  readonly accountUsersError = this.accountUsersErrorSignal.asReadonly();

  /**
   * Loads the IAM users belonging to a clinic account.
   *
   * @param accountId the clinic IAM account identifier.
   */
  loadAccountUsers(accountId: number): void {
    this.loadingAccountUsersSignal.set(true);
    this.accountUsersErrorSignal.set(false);
    this.accountUsersSignal.set([]);

    this.api.getAccountUsers(accountId)
      .pipe(finalize(() => this.loadingAccountUsersSignal.set(false)))
      .subscribe({
        next: resources => {
          this.accountUsersSignal.set(
            resources.map(resource =>
              UserAssembler.fromAccountUserResponse(resource)
            )
          );
        },
        error: () => {
          this.accountUsersErrorSignal.set(true);
        }
      });
  }

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

  /**
   * Paso 1 del onboarding: crea la cuenta y entra de una vez, para que el usuario
   * pase directo a "Configura tu perfil" (paso 2, en Profiles) sin volver a escribir nada.
   */
  signUpAndSignIn(email: string, password: string, accountType: AccountType): Observable<User> {
    return this.signUp(email, password, accountType).pipe(
      switchMap(() => this.signIn(email, password)),
    );
  }

  /**
   * Cambia la contraseña del usuario con sesión. Se usa cuando un veterinario
   * entra por primera vez con la contraseña temporal que le dio su clínica.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<User> {
    const user = this._currentUser();
    if (!user) return throwError(() => new Error('No hay sesión'));
    return this.api.changePassword(user.id, { currentPassword, newPassword }).pipe(
      map(() => user.withPasswordChanged()),
      tap((updated) => this._currentUser.set(updated)),
    );
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

  /** Pide al backend el correo con el enlace. Responde igual exista o no el correo. */
  requestPasswordRecovery(email: string): Observable<void> {
    return this.api.requestPasswordRecovery({ email }).pipe(map(() => undefined));
  }

  /** Cambia la contraseña con el token que llegó en el enlace del correo. */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.api.resetPassword({ token, newPassword }).pipe(map(() => undefined));
  }

  signOut(): void {
    this.tokens.clear();
    this._currentUser.set(null);
    this.accountUsersSignal.set([]);
    this.accountUsersErrorSignal.set(false);
    this.loadingAccountUsersSignal.set(false);
  }

  /**
   * Creates a veterinarian member within a clinic account.
   */
  createMember(command: CreateMemberUserCommand): Observable<User> {
    const request: CreateMemberUserRequest = {
      email: command.email.trim(),
      password: command.password,
    };

    return this.api
      .createMember(command.accountId, request)
      .pipe(map((response) => UserAssembler.fromUserResponse(response)));
  }
}
