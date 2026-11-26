import { Routes } from '@angular/router';

/** Dueño y veterinario: la misma pantalla; cambia de dónde salen las mascotas y quién registra vacunas. */
export const MEDICAL_HISTORY_ROUTES: Routes = [
  {
    path: '',
    title: 'Historia clínica',
    loadComponent: () =>
      import('./presentation/views/medical-history-view/medical-history-view').then(
        (m) => m.MedicalHistoryView,
      ),
  },
];
