/**
 * Clases del modelo de radiografías (clasificación multietiqueta entrenada con VetXRay).
 * Cada clase trae su propio porcentaje: no suman 100.
 */
export const RADIOGRAPH_CLASSES = [
  'cardiomegaly',
  'alveolar_pattern',
  'bronchial_pattern',
  'pleural_effusion',
  'mass',
  'interstitial_pattern',
  'pneumothorax',
  'pleural_mineralization',
  'megaesophagus',
  'no_finding',
] as const;

/** Clases que significan "sin hallazgos". 'normal' la usa el modelo fake del backend. */
const NORMAL_LABELS = new Set(['no_finding', 'normal']);

/** Clases con muy pocos casos en el entrenamiento: su porcentaje es poco fiable. */
const LOW_RELIABILITY_LABELS = new Set(['pneumothorax', 'megaesophagus']);

export function isNormalLabel(label: string): boolean {
  return NORMAL_LABELS.has(label.toLowerCase());
}

export function isLowReliabilityLabel(label: string): boolean {
  return LOW_RELIABILITY_LABELS.has(label.toLowerCase());
}
