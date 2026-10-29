import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { OwnerDashboard } from '../domain/model/dashboard/owner-dashboard';
import { VetDashboard } from '../domain/model/dashboard/vet-dashboard';
import { OWNER_DASHBOARD_DEMO } from './demo/owner-dashboard.demo';
import { VET_DASHBOARD_DEMO } from './demo/vet-dashboard.demo';

/**
 * Puerta de entrada a los datos del panel.
 * HOY devuelve datos de demo con una pequeña espera para imitar la red.
 * MAÑANA, cuando el backend tenga los endpoints, solo cambias el cuerpo de estos métodos:
 *   return this.http.get<OwnerDashboardResponse>(`${environment.apiBaseUrl}/dashboards/pet-owner`)
 *     .pipe(map(DashboardAssembler.toOwner));
 * El store y las vistas no se enteran del cambio: esa es la ventaja de separar capas.
 */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  getOwnerDashboard(): Observable<OwnerDashboard> {
    return of(OWNER_DASHBOARD_DEMO).pipe(delay(250));
  }

  getVetDashboard(): Observable<VetDashboard> {
    return of(VET_DASHBOARD_DEMO).pipe(delay(250));
  }
}
