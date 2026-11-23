/**
 * Represents the credit balance of an AI capability.
 */
export class CreditBalance {
  constructor(
    public readonly limit: number,
    public readonly reserved: number,
    public readonly consumed: number,
    public readonly available: number,
  ) {}

  get occupiedCredits(): number {
    return this.reserved + this.consumed;
  }

  get occupiedPercentage(): number {
    if (this.limit <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (this.occupiedCredits / this.limit) * 100));
  }
}
