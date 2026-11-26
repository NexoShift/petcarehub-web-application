import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { HistoryAccessGrant } from '../domain/model/history-access-grant.entity';
import { HistoryAccessGrantAssembler } from './history-access-grant-assembler';
import type { HistoryAccessGrantResource } from './history-access-grant.resource';

/**
 * Permisos del dueño para que una clínica vea el historial de otras clínicas.
 * El dueño los da y los quita desde la app móvil; la web solo los lee (el vet ve el de su clínica).
 */
@Injectable({
  providedIn: 'root',
})
export class HistoryAccessGrantsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly petsUrl = `${environment.apiBaseUrl}${environment.profilePetsEndpointPath}`;

  private grantsUrl(petId: number): string {
    return `${this.petsUrl}/${petId}/history-access-grants`;
  }

  getByPetId(petId: number): Observable<HistoryAccessGrant[]> {
    return this.http
      .get<HistoryAccessGrantResource[]>(this.grantsUrl(petId))
      .pipe(map((resources) => HistoryAccessGrantAssembler.toEntitiesFromResources(resources)));
  }
}
