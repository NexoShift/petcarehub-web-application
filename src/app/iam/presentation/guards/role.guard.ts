import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam-store';
import { Role } from '../../domain/model/role';

/** Comodidad visual: la seguridad real la hace Spring Security. */
export const roleGuard =
  (role: Role): CanActivateFn =>
  () =>
    inject(IamStore).currentUser()?.hasRole(role) ? true : inject(Router).createUrlTree(['/home']);
