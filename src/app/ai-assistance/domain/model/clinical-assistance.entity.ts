import { ClinicalBackground } from './clinical-background';
import { SoapDraft } from './soap-draft.entity';

/** Pedido de asistencia de un vet para una consulta, con todos sus borradores. */
export class ClinicalAssistance {
  constructor(
    readonly id: number,
    readonly consultationId: number,
    readonly petId: number,
    readonly veterinarianId: number,
    readonly currentReason: string,
    /** COMPLETED o FAILED (PENDING/PROCESSING solo existen dentro del backend). */
    readonly status: string,
    readonly failureReason: string | null,
    readonly backgrounds: Pick<ClinicalBackground, 'type' | 'referenceId'>[],
    readonly drafts: SoapDraft[],
    readonly createdAt: Date,
  ) {}

  /** El borrador más nuevo. */
  get latestDraft(): SoapDraft | null {
    return this.drafts[this.drafts.length - 1] ?? null;
  }

  /** El que ya se confirmó (aceptado o editado), si hay. */
  get confirmedDraft(): SoapDraft | null {
    return this.drafts.find(d => d.isConfirmed) ?? null;
  }

  /** Regla del backend: no se regenera después de confirmar un borrador. */
  get canRegenerate(): boolean {
    return this.confirmedDraft === null;
  }

  findDraft(id: number): SoapDraft | null {
    return this.drafts.find(d => d.id === id) ?? null;
  }
}
