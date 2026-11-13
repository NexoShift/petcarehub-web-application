import { HttpErrorResponse } from '@angular/common/http';
import { AnalysisStatus, RequesterRole } from '../domain/model/analysis-status';
import { BoundingBox } from '../domain/model/bounding-box';
import { ImageType } from '../domain/model/image-type';
import { VisionAnalysis } from '../domain/model/vision-analysis.entity';
import { VisionError } from '../domain/model/vision-error';
import { PROBABLE_THRESHOLD, VisionFinding } from '../domain/model/vision-finding.entity';
import { VisionAnalysisResponse, VisionFindingResponse } from './resources/vision-analysis.response';

/** Traduce el JSON del backend a entidades del dominio (capa anticorrupción). */
export class VisionAnalysisAssembler {
  static toEntity(r: VisionAnalysisResponse): VisionAnalysis {
    return new VisionAnalysis(
      r.id,
      r.petId,
      r.consultationId ?? null,
      r.imageType === ImageType.Radiograph ? ImageType.Radiograph : ImageType.Skin,
      r.status === AnalysisStatus.Failed ? AnalysisStatus.Failed : AnalysisStatus.Completed,
      r.modelId ?? null,
      r.failureReason ?? null,
      r.requestedByRole === RequesterRole.PetOwner ? RequesterRole.PetOwner : RequesterRole.Veterinarian,
      r.imageUrl,
      (r.findings ?? []).map(f => VisionAnalysisAssembler.toFinding(f)),
      new Date(r.createdAt),
    );
  }

  static toFinding(f: VisionFindingResponse): VisionFinding {
    const located = f.hasLocation !== false && f.left != null && f.top != null && f.width != null && f.height != null;
    return new VisionFinding(
      f.id,
      f.label,
      Math.round(f.confidencePercentage),
      f.probable ?? f.confidencePercentage >= PROBABLE_THRESHOLD,
      located ? new BoundingBox(f.left!, f.top!, f.width!, f.height!) : null,
    );
  }

  /**
   * Status HTTP → error del dominio. Llega como ApiError (errorInterceptor) o como HttpErrorResponse.
   * 413 lo corta Spring antes del controller; 422 es imagen no evaluable o "radiografía" con color.
   */
  static toError(err: unknown): VisionError {
    const status = (err as HttpErrorResponse | { status?: number })?.status;
    switch (status) {
      case 0: return VisionError.Network;
      case 400: return VisionError.MissingData;
      case 403: return VisionError.Forbidden;
      case 404: return VisionError.NotFound;
      case 413: return VisionError.TooLarge;
      case 422: return VisionError.NotEvaluable;
      case 429: return VisionError.UsageLimit;
      case 502:
      case 503:
      case 504: return VisionError.Unavailable;
      default: return VisionError.Unexpected;
    }
  }
}
