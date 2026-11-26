import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Subscription } from '../domain/model/subscription.entity';
import { CheckoutSession } from '../domain/model/checkout-session.entity';

import { SubscriptionAssembler } from './subscription-assembler';
import { CheckoutSessionAssembler } from './checkout-session-assembler';

import type { SubscriptionResource } from './subscription.resource';
import type { CheckoutSessionResource } from './checkout-session.resource';
import type { CreateSubscriptionRequest } from './create-subscription.request';

import { SubscriptionEntitlements } from '../domain/model/subscription-entitlements.entity';

import { AiCredit } from '../domain/model/ai-credit.entity';

import { SubscriptionEntitlementsAssembler } from './subscription-entitlements-assembler';

import { AiCreditAssembler } from './ai-credit-assembler';

import type { SubscriptionEntitlementsResource } from './subscription-entitlements.resource';

import type { AiCreditResource } from './ai-credit.resource';

import type { UpdateSubscriptionCancellationRequest } from './update-subscription-cancellation.request';

import { SubscriptionPaymentPage } from '../domain/model/subscription-payment-page';

import { SubscriptionPaymentAssembler } from './subscription-payment-assembler';

import type { SubscriptionPaymentPageResource } from './subscription-payment-page.resource';

/**
 * Provides HTTP operations for account subscriptions.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionsApiEndpoint {
  private readonly http = inject(HttpClient);

  private readonly endpointUrl = `${environment.apiBaseUrl}${environment.subscriptionAccountsEndpointPath}`;

  /**
   * Retrieves the subscription associated with an account.
   */
  getByAccountId(accountId: number): Observable<Subscription> {
    return this.http
      .get<SubscriptionResource>(`${this.endpointUrl}/${accountId}/subscription`)
      .pipe(map((resource) => SubscriptionAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates a pending subscription.
   */
  create(accountId: number, request: CreateSubscriptionRequest): Observable<Subscription> {
    return this.http
      .post<SubscriptionResource>(`${this.endpointUrl}/${accountId}/subscriptions`, request)
      .pipe(map((resource) => SubscriptionAssembler.toEntityFromResource(resource)));
  }

  /**
   * Creates or retrieves a Stripe Checkout session.
   */
  createCheckoutSession(accountId: number): Observable<CheckoutSession> {
    return this.http
      .post<CheckoutSessionResource>(
        `${this.endpointUrl}/${accountId}/subscription/checkout-sessions`,
        null,
      )
      .pipe(map((resource) => CheckoutSessionAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves the benefits of an active subscription.
   */
  getEntitlements(accountId: number): Observable<SubscriptionEntitlements> {
    return this.http
      .get<SubscriptionEntitlementsResource>(
        `${this.endpointUrl}/${accountId}/subscription/entitlements`,
      )
      .pipe(map((resource) => SubscriptionEntitlementsAssembler.toEntityFromResource(resource)));
  }

  /**
   * Retrieves the AI credit balances for the current billing period.
   */
  getAiCredits(accountId: number): Observable<AiCredit> {
    return this.http
      .get<AiCreditResource>(`${this.endpointUrl}/${accountId}/subscription/ai-credits`)
      .pipe(map((resource) => AiCreditAssembler.toEntityFromResource(resource)));
  }

  /**
   * Schedules or reverts the cancellation of a subscription.
   */
  updateCancellation(
    accountId: number,
    request: UpdateSubscriptionCancellationRequest,
  ): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${accountId}/subscription`, request);
  }

  /**
   * Retrieves a paginated payment history for an account subscription.
   */
  getPayments(
    accountId: number,
    limit: number = 20,
    startingAfter: string | null = null,
  ): Observable<SubscriptionPaymentPage> {
    let params = new HttpParams().set('limit', limit);

    if (startingAfter !== null) {
      params = params.set('startingAfter', startingAfter);
    }

    return this.http
      .get<SubscriptionPaymentPageResource>(
        `${this.endpointUrl}/${accountId}/subscription/payments`,
        { params },
      )
      .pipe(map((resource) => SubscriptionPaymentAssembler.toPageFromResource(resource)));
  }
}
