import { BoundingBox } from './bounding-box';
import { isLowReliabilityLabel, isNormalLabel } from './radiograph-classes';

/** Umbral desde el que un hallazgo se considera "probable" (lo mismo que decide el backend). */
export const PROBABLE_THRESHOLD = 50;

/**
 * Un hallazgo del modelo: qué encontró (label) y con cuánta confianza.
 * En piel trae caja; en radiografía no (box = null).
 */
export class VisionFinding {
  constructor(
    readonly id: number,
    /** Clase cruda del modelo: "dermatitis", "cardiomegalia"... La vista la traduce con i18n. */
    readonly label: string,
    /** Entero de 0 a 100. */
    readonly confidencePercentage: number,
    readonly probable: boolean,
    readonly box: BoundingBox | null,
  ) {}

  get hasLocation(): boolean {
    return this.box !== null;
  }

  /** "Sin hallazgos" (no_finding): no es una enfermedad. */
  get isNormal(): boolean {
    return isNormalLabel(this.label);
  }

  /** Clase con pocos casos de entrenamiento (neumotórax, megaesófago): tomar con cautela. */
  get lowReliability(): boolean {
    return isLowReliabilityLabel(this.label);
  }

  /** Nivel de confianza para pintar el chip: alto (80+), medio (50-79) o bajo. */
  get confidenceLevel(): 'high' | 'medium' | 'low' {
    if (this.confidencePercentage >= 80) return 'high';
    if (this.confidencePercentage >= PROBABLE_THRESHOLD) return 'medium';
    return 'low';
  }
}
