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
  private readonly _error = signal<string | null>(null);

  readonly owner = this._owner.asReadonly();
  readonly vet = this._vet.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  loadOwner(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getOwnerDashboard().subscribe({
      next: data => { this._owner.set(data); this._loading.set(false); },
      error: () => { this._error.set('No pudimos cargar tu panel. Intenta de nuevo.'); this._loading.set(false); },
    });
  }

  loadVet(): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getVetDashboard().subscribe({
      next: data => { this._vet.set(data); this._loading.set(false); },
      error: () => { this._error.set('No pudimos cargar el panel clínico. Intenta de nuevo.'); this._loading.set(false); },
    });
  }
}
