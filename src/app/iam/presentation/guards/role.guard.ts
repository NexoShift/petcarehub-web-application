import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { IamStore } from '../../application/iam-store';
import { Role } from '../../domain/model/role';

export const roleGuard = (role : Role): CanActivateFn => () =>
  inject(IamStore).currentUser()?.hasRole(role) ? true :
    inject(Router).createUrlTree(['/home']);
