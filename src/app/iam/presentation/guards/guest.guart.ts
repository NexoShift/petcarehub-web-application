import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam-store';

/**
 * Solo deja pasar a usuarios sin sesion: sign-in, sign-up
 */

export const guestGuard: CanActivateFn = () =>
  inject(IamStore).isSignedIn() ? inject(Router).createUrlTree(['/home']) : true;


