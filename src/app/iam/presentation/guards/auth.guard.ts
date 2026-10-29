import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam.store';

/** Solo deja pasar a usuarios con sesión. */
export const authGuard: CanActivateFn = () =>
  inject(IamStore).isSignedIn() ? true : inject(Router).createUrlTree(['/sign-in']);
