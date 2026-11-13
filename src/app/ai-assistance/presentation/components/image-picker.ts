import { MAX_IMAGE_BYTES, MIN_IMAGE_SIDE_PX } from '../../domain/model/request-vision-analysis.command';
import { VisionError } from '../../domain/model/vision-error';

/** Imagen elegida por el usuario, lista para mostrarse antes de subirla. */
export interface PickedImage {
  file: File;
  /** object URL para el <img> (se libera al salir de la pantalla). */
  url: string;
  width: number;
  height: number;
}

/**
 * Lee el tamaño real de la imagen en el navegador. Si es menor a 224 px o no es una imagen,
 * rechaza con un VisionError (así no se gasta una subida que el backend rechazaría con 422).
 */
export function readPickedImage(file: File): Promise<PickedImage> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png)$/.test(file.type)) return reject(VisionError.InvalidFile);
    if (file.size > MAX_IMAGE_BYTES) return reject(VisionError.TooLarge);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < MIN_IMAGE_SIDE_PX || img.naturalHeight < MIN_IMAGE_SIDE_PX) {
        URL.revokeObjectURL(url);
        return reject(VisionError.TooSmall);
      }
      resolve({ file, url, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(VisionError.InvalidFile);
    };
    img.src = url;
  });
}

/** "rocky-pata.jpg · 1920×1440" */
export function captionOf(image: PickedImage | null): string {
  return image ? `${image.file.name} · ${image.width}×${image.height}` : '';
}
