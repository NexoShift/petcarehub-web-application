import { Routes } from '@angular/router';
import { authGuard } from './iam';
import { IAM_ROUTES } from './iam/iam.routes';
import { Shell } from './shared/presentation/layout/shell/shell';

export const routes: Routes = [
  ...IAM_ROUTES,
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./shared/presentation/views/home/home').then((m) => m.Home),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: '' },
];
