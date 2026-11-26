/** Un medicamento de la receta. */
export interface Medication {
  readonly id: number;
  readonly name: string;
  readonly dosage: string;
  readonly frequency: string;
  readonly duration: string;
  readonly indication: string | null;
}

/** Receta emitida en una consulta: de 1 a 15 medicamentos. */
export class Prescription {
  constructor(
    readonly id: number,
    readonly issuedAt: Date,
    readonly generalInstruction: string | null,
    readonly medications: readonly Medication[],
    readonly prescribedByVeterinarianId: number,
  ) {}
}
