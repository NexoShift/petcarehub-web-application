import { TreatmentStatus } from '../enums/treatment-status.enum';

/** Indicación de tratamiento de una consulta (fechas sin hora: "2026-11-25"). */
export class Treatment {
  constructor(
    readonly id: number,
    readonly description: string,
    readonly instruction: string,
    readonly startDate: string,
    readonly endDate: string | null,
    readonly status: TreatmentStatus,
    readonly prescribedByVeterinarianId: number,
    readonly createdAt: Date,
  ) {}

  /** Vigente hoy: activo, ya empezó y no terminó (fechas en formato ISO, comparables como texto). */
  isCurrentOn(today: string): boolean {
    return (
      this.status === TreatmentStatus.Active &&
      this.startDate <= today &&
      (this.endDate === null || this.endDate >= today)
    );
  }
}
