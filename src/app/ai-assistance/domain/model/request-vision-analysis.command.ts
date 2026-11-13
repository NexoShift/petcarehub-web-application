import { ImageType } from './image-type';
import { VisionError } from './vision-error';

/** Límites que también valida el backend. Se revisan antes para no gastar una subida. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGE_SIDE_PX = 224;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png'] as const;

/**
 * Pedido de análisis. Solo se puede crear con create(), que valida el archivo:
 * si algo está mal lanza un VisionError y nunca llega al backend.
 */
export class RequestVisionAnalysisCommand {
  private constructor(
    readonly file: File,
    readonly imageType: ImageType,
    readonly petId: number,
    readonly consultationId: number | null,
  ) {}

  static create(params: {
    file: File | null;
    imageType: ImageType | null;
    petId: number | null;
    consultationId?: number | null;
  }): RequestVisionAnalysisCommand {
    const { file, imageType, petId } = params;
    if (!file || !imageType || !petId || petId <= 0) throw VisionError.MissingData;
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) throw VisionError.InvalidFile;
    if (file.size > MAX_IMAGE_BYTES) throw VisionError.TooLarge;
    const consultationId = params.consultationId && params.consultationId > 0 ? params.consultationId : null;
    return new RequestVisionAnalysisCommand(file, imageType, petId, consultationId);
  }
}
