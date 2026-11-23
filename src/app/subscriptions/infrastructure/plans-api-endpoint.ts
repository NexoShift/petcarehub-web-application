import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Plan } from '../domain/model/plan.entity';
import type { SubscriberType } from '../domain/model/subscriber-type';

import { PlanAssembler } from './plan-assembler';
import type { PlanResource } from './plan.resource';

/**
 * Provides HTTP operations for the subscription plan catalog.
 */
@Injectable({
  providedIn: 'root',
})
export class PlansApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.subscriptionPlansEndpointPath}`;

  /**
   * Retrieves available plans for a subscriber type.
   */
  getAll(subscriberType: SubscriberType): Observable<Plan[]> {
    return this.http
      .get<PlanResource[]>(this.endpointUrl, {
        params: { subscriberType },
      })
      .pipe(map((resources) => PlanAssembler.toEntitiesFromResources(resources)));
  }

  /**
   * Retrieves a subscription plan by its identifier.
   */
  getById(planId: number): Observable<Plan> {
    return this.http
      .get<PlanResource>(`${this.endpointUrl}/${planId}`)
      .pipe(map((resource) => PlanAssembler.toEntityFromResource(resource)));
  }
}
