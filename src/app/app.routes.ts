import { Routes } from '@angular/router';
import { DASHBOARD_ROUTES } from './shared/presentation/dashboard.routes';
import { authGuard, roleGuard } from './iam';
import { IAM_ROUTES } from './iam/iam.routes';

export const routes: Routes = [
  // Pantallas públicas: sign-in, sign-up, recuperar y restablecer contraseña
  ...IAM_ROUTES,
  {
    // Todo lo de aquí abajo necesita sesión y se muestra dentro del Shell (menú + barra)
    path: '',
    loadComponent: () => import('./shared/presentation/layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      ...DASHBOARD_ROUTES,
      {
        path: 'clinical-exams',
        canActivate: [roleGuard('ROLE_VETERINARIAN')],
        loadChildren: () =>
          import('./clinical-exams/clinical-exams.routes').then((m) => m.CLINICAL_EXAMS_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      // Enlaces del menú que aún no tienen pantalla
      {
        path: '**',
        loadComponent: () =>
          import('./shared/presentation/views/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
];
