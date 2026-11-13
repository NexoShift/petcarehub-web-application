import { Injectable, inject, signal } from '@angular/core';
import { OwnerDashboard } from '../domain/model/dashboard/owner-dashboard';
import { VetDashboard } from '../domain/model/dashboard/vet-dashboard';
import { DashboardApi } from '../infrastructure/dashboard.api';

/**
 * Estado de los paneles. Las vistas leen estas señales y llaman a load*().
 * Nunca usan DashboardApi ni HttpClient directamente.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(DashboardApi);

  private readonly _owner = signal<OwnerDashboard | null>(null);
  private readonly _vet = signal<VetDashboard | null>(null);
  private readonly _loading = signal(false);
  /** Clave de i18n del error (la vista la traduce con | translate). */
  private readonly _error = signal<string | null>(null);

  readonly owner = this._owner.asReadonly();
  readonly vet = this._vet.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadOwner(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._owner.set(await this.api.getOwnerDashboard());
    } catch {
      this._error.set('errors.ownerDashboard');
    } finally {
      this._loading.set(false);
    }
  }

  async loadVet(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._vet.set(await this.api.getVetDashboard());
    } catch {
      this._error.set('errors.vetDashboard');
    } finally {
      this._loading.set(false);
    }
  }
}
