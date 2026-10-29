import { ActiveTreatment, AiUsage } from '../model/dashboard/owner-dashboard';

/*
 * Cálculos puros (sin Angular): reciben datos y devuelven un número.
 * Al no depender de nada se prueban fácil (ver progress.spec.ts).
 */

/** Tomas que tiene el tratamiento completo. Ej.: 7 días × 2 tomas = 14. */
export function totalDoses(t: ActiveTreatment): number {
  return t.totalDays * t.medication.dosesPerDay;
}

/** Porcentaje del tratamiento cumplido, redondeado y entre 0 y 100. */
export function treatmentProgress(t: ActiveTreatment): number {
  const total = totalDoses(t);
  if (total === 0) return 0;
  return Math.min(100, Math.round((t.dosesTaken / total) * 100));
}

/** Porcentaje usado de una cuota de IA (para la barra). */
export function usagePercent(u: AiUsage): number {
  return u.limit === 0 ? 0 : Math.min(100, Math.round((u.used / u.limit) * 100));
}
