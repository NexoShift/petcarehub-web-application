import { ActiveTreatment, AiUsage } from '../model/dashboard/owner-dashboard';

/*
 * Cálculos puros (sin Angular): reciben datos y devuelven un número.
 * Al no depender de nada se prueban fácil (ver progress.spec.ts).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Días de calendario de a hasta b (fechas yyyy-MM-dd). Negativo si b es antes que a. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/** Fecha local de hoy en formato yyyy-MM-dd (la que usa el backend para tratamientos y vacunas). */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Porcentaje del tratamiento cumplido por días, redondeado y entre 0 y 100. */
export function treatmentProgress(t: Pick<ActiveTreatment, 'currentDay' | 'totalDays'>): number {
  if (!t.totalDays) return 0;
  return Math.min(100, Math.max(0, Math.round((t.currentDay / t.totalDays) * 100)));
}

/** Porcentaje usado de una cuota de IA (para la barra). */
export function usagePercent(u: Pick<AiUsage, 'used' | 'limit'>): number {
  return u.limit === 0 ? 0 : Math.min(100, Math.round((u.used / u.limit) * 100));
}
