import { Routes } from '@angular/router';
import { matchRole } from '../../iam';

/**
 * Dos rutas con el MISMO path "home". matchRole decide cuál se usa:
 * si la cuenta es de veterinario entra a la primera; si no, Angular prueba la segunda.
 * Cada panel se descarga solo cuando hace falta (lazy loading).
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'home',
    canMatch: [matchRole('ROLE_VETERINARIAN')],
    loadComponent: () => import('./views/vet-dashboard/vet-dashboard').then(m => m.VetDashboard),
  },
  {
    path: 'home',
    canMatch: [matchRole('ROLE_PET_OWNER')],
    loadComponent: () => import('./views/owner-dashboard/owner-dashboard').then(m => m.OwnerDashboard),
  },
];
