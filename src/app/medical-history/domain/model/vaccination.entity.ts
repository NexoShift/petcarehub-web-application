/** Dates are ISO calendar dates (yyyy-MM-dd), compared as text. */
export class Vaccination {
  constructor(
    readonly id: number,
    readonly vaccineName: string,
    readonly doseNumber: number | null,
    readonly appliedOn: string,
    readonly nextDoseOn: string | null,
    readonly batchNumber: string | null,
    readonly notes: string | null,
    readonly veterinarianId: number | null,
    readonly clinicId: number | null,
  ) {}

  /** The next dose date has already passed. */
  isOverdueOn(today: string): boolean {
    return this.nextDoseOn !== null && this.nextDoseOn < today;
  }

  /** The next dose is due within the given number of days (today included). */
  isDueSoonOn(today: string, days = 30): boolean {
    if (this.nextDoseOn === null || this.nextDoseOn < today) return false;
    const limit = new Date(`${today}T00:00:00Z`);
    limit.setUTCDate(limit.getUTCDate() + days);
    return this.nextDoseOn <= limit.toISOString().slice(0, 10);
  }
}
