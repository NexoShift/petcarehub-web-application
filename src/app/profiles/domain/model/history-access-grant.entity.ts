export type HistoryAccessStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

/**
 * Permiso temporal del dueño para que una clínica vea el historial de su mascota
 * hecho en otras clínicas (consultas, exámenes, vacunas y antecedentes para la IA).
 * Lo da por horas (1 a 72) desde la app móvil.
 */
export class HistoryAccessGrant {
  constructor(
    public readonly id: number,
    public readonly petId: number,
    public readonly clinicId: number,
    public readonly grantedAt: Date,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly status: HistoryAccessStatus,
  ) {}

  /** Vigente ahora (el backend puede no haber pasado aún el estado a EXPIRED). */
  isActiveAt(now: Date): boolean {
    return this.status === 'ACTIVE' && this.expiresAt.getTime() > now.getTime();
  }

  /** Horas que faltan, redondeadas hacia arriba (0 si ya no está vigente). */
  hoursLeftAt(now: Date): number {
    if (!this.isActiveAt(now)) return 0;
    return Math.ceil((this.expiresAt.getTime() - now.getTime()) / 3_600_000);
  }
}
