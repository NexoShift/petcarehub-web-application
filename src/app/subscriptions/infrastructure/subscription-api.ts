import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { CheckoutSession } from '../domain/model/checkout-session.entity';

import type { SubscriberType } from '../domain/model/subscriber-type';

import { PlansApiEndpoint } from './plans-api-endpoint';
import { SubscriptionsApiEndpoint } from './subscriptions-api-endpoint';

import type { CreateSubscriptionRequest } from './create-subscription.request';

import { SubscriptionEntitlements } from '../domain/model/subscription-entitlements.entity';

import { AiCredit } from '../domain/model/ai-credit.entity';
import type { UpdateSubscriptionCancellationRequest } from './update-subscription-cancellation.request';

import { SubscriptionPaymentPage } from '../domain/model/subscription-payment-page';

/**
 * Provides access to the Subscriptions bounded context API.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionApi {
  private readonly plansEndpoint = inject(PlansApiEndpoint);
  private readonly subscriptionsEndpoint = inject(SubscriptionsApiEndpoint);

  // --------------------------------------------------
  // Plans
  // --------------------------------------------------

  getPlans(subscriberType: SubscriberType): Observable<Plan[]> {
    return this.plansEndpoint.getAll(subscriberType);
  }

  getPlanById(planId: number): Observable<Plan> {
    return this.plansEndpoint.getById(planId);
  }

  // --------------------------------------------------
  // Subscriptions
  // --------------------------------------------------

  getSubscriptionByAccountId(accountId: number): Observable<Subscription> {
    return this.subscriptionsEndpoint.getByAccountId(accountId);
  }

  createSubscription(
    accountId: number,
    request: CreateSubscriptionRequest,
  ): Observable<Subscription> {
    return this.subscriptionsEndpoint.create(accountId, request);
  }

  createCheckoutSession(accountId: number): Observable<CheckoutSession> {
    return this.subscriptionsEndpoint.createCheckoutSession(accountId);
  }

  // --------------------------------------------------
  // Subscription Benefits
  // --------------------------------------------------

  getSubscriptionEntitlements(accountId: number): Observable<SubscriptionEntitlements> {
    return this.subscriptionsEndpoint.getEntitlements(accountId);
  }

  getAiCredits(accountId: number): Observable<AiCredit> {
    return this.subscriptionsEndpoint.getAiCredits(accountId);
  }

  updateSubscriptionCancellation(
    accountId: number,
    request: UpdateSubscriptionCancellationRequest,
  ): Observable<void> {
    return this.subscriptionsEndpoint.updateCancellation(accountId, request);
  }

  // --------------------------------------------------
  // Payment History
  // --------------------------------------------------

  getSubscriptionPayments(
    accountId: number,
    limit: number = 20,
    startingAfter: string | null = null,
  ): Observable<SubscriptionPaymentPage> {
    return this.subscriptionsEndpoint.getPayments(accountId, limit, startingAfter);
  }
}
