import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam.store';

/**
 * Va en el Shell: si el usuario todavía tiene la contraseña temporal,
 * no lo deja entrar a ninguna pantalla hasta que la cambie.
 */
export const passwordChangeGuard: CanActivateFn = () =>
  inject(IamStore).currentUser()?.mustChangePassword
    ? inject(Router).createUrlTree(['/change-password'])
    : true;

/**
 * Va en /change-password: solo se abre con sesión y si la contraseña es temporal.
 * Sin sesión → /sign-in. Con la contraseña ya cambiada → /home.
 */
export const temporaryPasswordGuard: CanActivateFn = () => {
  const user = inject(IamStore).currentUser();
  if (!user) return inject(Router).createUrlTree(['/sign-in']);
  return user.mustChangePassword ? true : inject(Router).createUrlTree(['/home']);
};
