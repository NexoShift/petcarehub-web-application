import { Routes } from '@angular/router';
import { CLINICAL_ASSISTANT_PROVIDERS, OWNER_EXPLAIN_PROVIDERS } from './llm.providers';
import { VISION_PROVIDERS } from './vision.providers';

/**
 * Rutas del contexto AI Assistance. app.routes.ts las monta dentro del Shell, cada una con su rol:
 *   /visual-analysis → dueño (visión)      /imaging      → vet (visión)
 *   /ai-explain      → dueño (LLM, chat)   /ai-assistant → vet (LLM, borrador SOAP)
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

export const OWNER_AI_EXPLAIN_ROUTES: Routes = [
  {
    path: '',
    providers: OWNER_EXPLAIN_PROVIDERS,
    loadComponent: () =>
      import('./presentation/views/owner-ai-explain/owner-ai-explain').then((m) => m.OwnerAiExplain),
  },
];

export const VET_CLINICAL_ASSISTANT_ROUTES: Routes = [
  {
    path: '',
    providers: CLINICAL_ASSISTANT_PROVIDERS,
    loadComponent: () =>
      import('./presentation/views/vet-clinical-assistant/vet-clinical-assistant').then(
        (m) => m.VetClinicalAssistant,
      ),
  },
];
