import { Routes } from '@angular/router';
import { VISION_PROVIDERS } from './vision.providers';

/**
 * Rutas del contexto AI Assistance. app.routes.ts las monta dentro del Shell, cada una con su rol:
 *   /visual-analysis → dueño (visión)      /imaging      → vet (visión)
 * Los providers van en la ruta: cada pantalla tiene su propio store y se limpia al salir.
 */
export const OWNER_VISUAL_ANALYSIS_ROUTES: Routes = [
  {
    path: '',
    providers: VISION_PROVIDERS,
    loadComponent: () =>
      import('./presentation/views/owner-visual-analysis/owner-visual-analysis').then(
        (m) => m.OwnerVisualAnalysis,
      ),
  },
];

export const VET_IMAGING_ROUTES: Routes = [
  {
    path: '',
    providers: VISION_PROVIDERS,
    loadComponent: () =>
      import('./presentation/views/vet-imaging/vet-imaging').then((m) => m.VetImaging),
  },
];
