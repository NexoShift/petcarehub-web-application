/** Phases of the consultation flow shown in the stepper (MW-23 to MW-26). */
export type ConsultationPhaseId =
  'anamnesis' | 'assessment' | 'images' | 'assistant' | 'diagnosis' | 'completion';

export interface ConsultationPhase {
  id: ConsultationPhaseId;
  number: number;
  /** Phase 3 (images) comes from AI Assistance (computer vision); phase 4 (LLM) is not built yet. */
  available: boolean;
}

export const CONSULTATION_PHASES: readonly ConsultationPhase[] = [
  { id: 'anamnesis', number: 1, available: true },
  { id: 'assessment', number: 2, available: true },
  { id: 'images', number: 3, available: true },
  { id: 'assistant', number: 4, available: false },
  { id: 'diagnosis', number: 5, available: true },
  { id: 'completion', number: 6, available: true },
];

export const AVAILABLE_PHASES: readonly ConsultationPhaseId[] = CONSULTATION_PHASES.filter(
  (phase) => phase.available,
).map((phase) => phase.id);
