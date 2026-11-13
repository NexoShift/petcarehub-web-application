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
      {
        path: 'consultations',
        canActivate: [roleGuard('ROLE_VETERINARIAN')],
        loadChildren: () =>
          import('./clinical-attention/clinical-attention.routes').then(
            (m) => m.CLINICAL_ATTENTION_ROUTES,
          ),
      },
      // Dueño: consultas de sus mascotas y exámenes con resultados validados (solo lectura)
      {
        path: 'my-consultations',
        canActivate: [roleGuard('ROLE_PET_OWNER')],
        loadChildren: () =>
          import('./clinical-attention/clinical-attention.routes').then(
            (m) => m.OWNER_CONSULTATIONS_ROUTES,
          ),
      },
      {
        path: 'exams',
        canActivate: [roleGuard('ROLE_PET_OWNER')],
        loadChildren: () =>
          import('./clinical-exams/clinical-exams.routes').then((m) => m.OWNER_EXAMS_ROUTES),
      },
      {
        path: 'profiles',
        loadChildren: () =>
          import('./profiles/presentation/profiles.routes').then((m) => m.profileRoutes),
      },
      // AI Assistance (visión): dueño /visual-analysis, vet /imaging
      {
        path: 'visual-analysis',
        canActivate: [roleGuard('ROLE_PET_OWNER')],
        loadChildren: () =>
          import('./ai-assistance/ai-assistance.routes').then(
            (m) => m.OWNER_VISUAL_ANALYSIS_ROUTES,
          ),
      },
      {
        path: 'imaging',
        canActivate: [roleGuard('ROLE_VETERINARIAN')],
        loadChildren: () =>
          import('./ai-assistance/ai-assistance.routes').then((m) => m.VET_IMAGING_ROUTES),
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
