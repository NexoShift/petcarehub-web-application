/**
 * Consulta que el dueño usa como referencia en "Explicar con IA" (panel "Contexto clínico activo").
 * Es un modelo de lectura: los datos son de Clinical Attention (consulta, diagnóstico, tratamiento)
 * y de Profiles (veterinario).
 */
export interface ReferenceConsultation {
  id: number;
  code: string;          // "#C-2026-0046"
  date: string;          // "2026-09-12"
  reason: string;
  /** Diagnóstico principal vigente; vacío si aún no tiene. */
  diagnosis: string;
  /** totalDays es null si el tratamiento no tiene fecha de fin. */
  treatment: { name: string; route: string; day: number; totalDays: number | null } | null;
  vet: { name: string; license: string };
}

/** Consulta en curso de un paciente: lo que el vet elige en el Asistente clínico. */
export interface ActiveConsultation {
  id: number;
  reason: string;
  date: string;
  veterinarianId: number;
}
