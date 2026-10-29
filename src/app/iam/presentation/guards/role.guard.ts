import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam.store';
import { Role } from '../../domain/model/role';

/** Comodidad visual: la seguridad real la hace Spring Security. */
export const roleGuard = (role: Role): CanActivateFn => () =>
  inject(IamStore).currentUser()?.hasRole(role) ? true : inject(Router).createUrlTree(['/home']);

/**
 * Elige entre rutas con el MISMO path según el rol.
 * Si devuelve false, Angular no entra en error: prueba la siguiente ruta con ese path.
 * Así /home abre el panel del dueño o el del veterinario sin un "if" en ningún componente.
 */
export const matchRole = (role: Role): CanMatchFn => () =>
  inject(IamStore).currentUser()?.hasRole(role) ?? false;
