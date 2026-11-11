import { Provider } from '@angular/core';
import { VisionStore } from './application/vision.store';
import { VisionAnalysisRepository } from './domain/repositories/vision-analysis.repository';
import { HttpVisionAnalysisRepository } from './infrastructure/http-vision-analysis.repository';

/**
 * Lo que necesita cualquier pantalla de visión: su propio store y el repositorio HTTP.
 * Lo usan las rutas (/visual-analysis, /imaging) y el panel de imágenes de la consulta.
 */
export const VISION_PROVIDERS: Provider[] = [
  VisionStore,
  { provide: VisionAnalysisRepository, useClass: HttpVisionAnalysisRepository },
];
