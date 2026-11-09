/**
 * Dónde está un hallazgo dentro de la foto, normalizado de 0 a 1 desde arriba a la izquierda.
 * Así la caja sirve para cualquier tamaño de pantalla: basta pasarla a porcentaje.
 */
export class BoundingBox {
  constructor(
    readonly left: number,
    readonly top: number,
    readonly width: number,
    readonly height: number,
  ) {}

  /** Valores listos para [style.left.%], [style.top.%]... (recortados al borde de la imagen). */
  toPercent(): { left: number; top: number; width: number; height: number } {
    const clamp = (v: number) => Math.min(100, Math.max(0, v * 100));
    const left = clamp(this.left);
    const top = clamp(this.top);
    return {
      left,
      top,
      width: Math.min(100 - left, clamp(this.width)),
      height: Math.min(100 - top, clamp(this.height)),
    };
  }
}
