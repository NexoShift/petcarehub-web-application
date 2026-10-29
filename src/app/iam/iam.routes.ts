import { Routes } from '@angular/router';
import { guestGuard } from './presentation/guards/guest.guard';

export const IAM_ROUTES: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () => import('./presentation/views/sign-in/sign-in').then(m => m.SignIn),
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () => import('./presentation/views/sign-up/sign-up').then(m => m.SignUp),
  },
  {
    path: 'password-recovery',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./presentation/views/password-recovery/password-recovery').then(m => m.PasswordRecovery),
  },
  {
    // El backend arma el enlace del correo como /reset-password?token=...
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./presentation/views/reset-password/reset-password').then(m => m.ResetPassword),
  },
];
