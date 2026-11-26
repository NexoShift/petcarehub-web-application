/** Qué decidió el vet sobre un borrador. */
export enum DraftDecision {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Edited = 'EDITED',
  Discarded = 'DISCARDED',
}

/** Borrador SOAP preliminar generado por el LLM. */
export class SoapDraft {
  constructor(
    readonly id: number,
    readonly subjective: string,
    readonly objective: string,
    readonly assessment: string,
    readonly plan: string,
    readonly warnings: string[],
    readonly model: string,
    readonly decision: DraftDecision,
    readonly editedText: string | null,
    /** Ruta del PDF; null hasta que se acepta o edita. */
    readonly reportUrl: string | null,
    readonly createdAt: Date,
  ) {}

  get isPending(): boolean {
    return this.decision === DraftDecision.Pending;
  }

  get isConfirmed(): boolean {
    return this.decision === DraftDecision.Accepted || this.decision === DraftDecision.Edited;
  }

  get isDiscarded(): boolean {
    return this.decision === DraftDecision.Discarded;
  }

  /** Texto plano S/O/A/P: es lo que se precarga al editar. */
  composedText(): string {
    return [
      `S: ${this.subjective}`,
      `O: ${this.objective}`,
      `A: ${this.assessment}`,
      `P: ${this.plan}`,
    ].join('\n\n');
  }
}
