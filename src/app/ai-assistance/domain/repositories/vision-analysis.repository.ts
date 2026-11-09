import { Observable } from 'rxjs';
import { RequestVisionAnalysisCommand } from '../model/request-vision-analysis.command';
import { VisionAnalysis } from '../model/vision-analysis.entity';

/**
 * Puerto del repositorio. El dominio y el store solo conocen esta clase abstracta;
 * la implementación HTTP se elige en ai-assistance.routes.ts (providers).
 * Los errores llegan como VisionError.
 */
export abstract class VisionAnalysisRepository {
  abstract analyze(command: RequestVisionAnalysisCommand): Observable<VisionAnalysis>;
  abstract findById(id: number): Observable<VisionAnalysis>;
  /** Más nuevo primero. */
  abstract findByPetId(petId: number): Observable<VisionAnalysis[]>;
  /** La imagen analizada como Blob (pasa por el interceptor, así lleva el token). */
  abstract loadImage(analysis: VisionAnalysis): Observable<Blob>;
}
