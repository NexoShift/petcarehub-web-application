/** Clinical interview with the owner. Registered once per consultation. */
export class Anamnesis {
  constructor(
    readonly id: number,
    readonly chiefComplaint: string,
    readonly evolutionTime: string,
    readonly symptoms: readonly string[],
    readonly diet: string | null,
    readonly behavior: string | null,
    readonly previousTreatments: string | null,
    readonly ownerObservations: string | null,
  ) {}
}
