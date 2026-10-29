import { Routes } from '@angular/router';
import { guestGuard } from './presentation/guards/guest.guart';

export const IAM_ROUTES: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: ()=> import('./presentation/views/sign-in/sign-in').then(m => m.SignIn),
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () => import('./presentation/views/sign-up/sign-up').then(m => m.SignUp),
  },
];
