/** Result of a clinical exam; once validated by a veterinarian it cannot change. */
export class ExamResult {
  constructor(
    readonly id: number,
    readonly summary: string,
    readonly values: string | null,
    readonly interpretation: string | null,
    readonly resultDate: string,
    readonly validated: boolean,
    readonly validatedBy: number | null,
    readonly validatedAt: Date | null,
  ) {}
}
