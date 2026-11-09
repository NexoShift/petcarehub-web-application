import { VisionAnalysis } from '../model/vision-analysis.entity';

/**
 * Clasificación orientativa que ve el dueño (no es un diagnóstico):
 * - NONE: sin hallazgos confiables → seguir observando.
 * - ROUTINE: hay hallazgos de 50 a 79 % → consulta de rutina dentro de 48 h.
 * - PRIORITY: algún hallazgo de 80 % o más → consulta dentro de 24 h.
 */
export type TriageLevel = 'NONE' | 'ROUTINE' | 'PRIORITY';

export interface OrientativeTriage {
  level: TriageLevel;
  /** Plazo sugerido para ir al veterinario, o null si no aplica. */
  withinHours: number | null;
}

export function orientativeTriage(analysis: VisionAnalysis): OrientativeTriage {
  const top = analysis.isCompleted ? analysis.probableFindings[0] : undefined;
  if (!top) return { level: 'NONE', withinHours: null };
  if (top.confidencePercentage >= 80) return { level: 'PRIORITY', withinHours: 24 };
  return { level: 'ROUTINE', withinHours: 48 };
}
