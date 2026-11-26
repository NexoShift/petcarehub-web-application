/** De dónde sale un antecedente que se le puede pasar al asistente. */
export enum BackgroundType {
  PreviousConsultation = 'PREVIOUS_CONSULTATION',
  VisionAnalysis = 'VISION_ANALYSIS',
}

/** Antecedente que el vet marca con un check antes de generar el borrador. */
export interface ClinicalBackground {
  type: BackgroundType;
  referenceId: number;
  /** "2026-09-12" */
  date: string;
  title: string;
  summary: string;
}

/** Clave única para el check (el mismo id puede existir en los dos tipos). */
export const backgroundKey = (b: { type: BackgroundType; referenceId: number }) => `${b.type}:${b.referenceId}`;

/** Máximo de antecedentes por pedido (lo mismo que valida el backend). */
export const MAX_BACKGROUNDS = 10;
