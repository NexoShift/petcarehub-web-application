import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { IamStore } from '../../iam';

const subscriptionAccessGuard: CanActivateFn = () => {
  const user = inject(IamStore).currentUser();

  return user?.isPetOwner || user?.isClinicAdmin ? true : inject(Router).createUrlTree(['/home']);
};

export const subscriptionRoutes: Routes = [
  {
    path: '',
    canActivate: [subscriptionAccessGuard],
    loadComponent: () =>
      import('./views/subscription-management/subscription-management').then(
        (m) => m.SubscriptionManagement,
      ),
  },
];
