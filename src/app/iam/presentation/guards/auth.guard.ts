import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../application/iam-store';

/**+
 * Verifica y solo deja pasar a usuarios con la sesion activa
 */
export const authGuard: CanActivateFn = () =>
    inject(IamStore).isSignedIn() ? true : inject(Router).createUrlTree(['/sign-in']);


