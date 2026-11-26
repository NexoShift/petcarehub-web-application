import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  catchError, EMPTY, finalize, forkJoin, Observable,
  of, switchMap, tap, throwError,
  exhaustMap, filter, map, take, timeout, timer,
} from 'rxjs';

import { Plan } from '../domain/model/plan.entity';
import { Subscription } from '../domain/model/subscription.entity';
import { CheckoutSession } from '../domain/model/checkout-session.entity';

import type { SubscriberType } from '../domain/model/subscriber-type';
import type { CreateSubscriptionCommand } from '../domain/model/create-subscription.command';

import { SubscriptionApi } from '../infrastructure/subscription-api';

import type { ApiError } from '../../shared/domain/api-error';

import type { UpdateSubscriptionCancellationCommand } from '../domain/model/update-subscription-cancellation.command';

/**
 * Manages subscription plans, account subscriptions and Stripe Checkout.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionStore {
  private readonly subscriptionApi = inject(SubscriptionApi);
  private readonly destroyRef = inject(DestroyRef);

  // State
  private readonly plansSignal = signal<Plan[]>([]);
  private readonly subscriptionSignal = signal<Subscription | null>(null);

  private readonly loadingSignal = signal(false);
  private readonly checkoutLoadingSignal = signal(false);

  private readonly errorSignal = signal<string | null>(null);
  private readonly checkoutErrorSignal = signal<string | null>(null);

  private readonly renewalLoadingSignal = signal(false);

  private readonly renewalPendingSignal = signal(false);

  private readonly renewalErrorSignal = signal<string | null>(null);

  private readonly renewalNoticeSignal = signal<string | null>(null);

  private readonly activationPendingSignal = signal(false);

  private readonly activationTimedOutSignal = signal(false);

  // Read-only state
  readonly plans = this.plansSignal.asReadonly();
  readonly subscription = this.subscriptionSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();
  readonly checkoutLoading = this.checkoutLoadingSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();
  readonly checkoutError = this.checkoutErrorSignal.asReadonly();

  readonly renewalLoading = this.renewalLoadingSignal.asReadonly();

  readonly renewalPending = this.renewalPendingSignal.asReadonly();

  readonly renewalError = this.renewalErrorSignal.asReadonly();

  readonly renewalNotice = this.renewalNoticeSignal.asReadonly();

  /** True while waiting for the Stripe webhook to activate the subscription after checkout. */
  readonly activationPending = this.activationPendingSignal.asReadonly();

  /** True when Stripe did not confirm the payment within the waiting time. */
  readonly activationTimedOut = this.activationTimedOutSignal.asReadonly();

  // Derived state
  readonly hasSubscription = computed(() => this.subscription() !== null);

  readonly currentPlan = computed(() => {
    const subscription = this.subscription();

    if (!subscription) {
      return null;
    }

    return this.plans().find((plan) => plan.id === subscription.planId) ?? null;
  });

  readonly hasActiveSubscription = computed(() => this.subscription()?.isActive ?? false);

  /**
   * Loads the available plans and current account subscription.
   */
  load(accountId: number, subscriberType: SubscriberType): void {

    if (this.loading() || this.checkoutLoading() || this.renewalLoading()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.checkoutErrorSignal.set(null);

    this.plansSignal.set([]);
    this.subscriptionSignal.set(null);

    this.renewalPendingSignal.set(false);
    this.renewalErrorSignal.set(null);
    this.renewalNoticeSignal.set(null);

    forkJoin({
      plans: this.subscriptionApi.getPlans(subscriberType),

      subscription: this.subscriptionApi.getSubscriptionByAccountId(accountId).pipe(
        catchError((error: ApiError) => {
          if (error.status === 404) {
            return of(null);
          }

          return throwError(() => error);
        }),
      ),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: ({ plans, subscription }) => {
          this.plansSignal.set([...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice));

          this.subscriptionSignal.set(subscription);
        },
        error: () => {
          this.errorSignal.set('subscriptions.errors.load');
        },
      });
  }

  /**
   * After returning from Stripe Checkout, the subscription becomes ACTIVE only when the
   * backend receives the Stripe webhook. Polls the subscription until it is active
   * (every 2 seconds, up to 60 seconds) so the user does not need to refresh the page.
   */
  waitForActivation(accountId: number): void {
    if (this.activationPending()) {
      return;
    }

    this.activationPendingSignal.set(true);
    this.activationTimedOutSignal.set(false);

    timer(1000, 2000)
      .pipe(
        exhaustMap(() =>
          this.subscriptionApi.getSubscriptionByAccountId(accountId).pipe(catchError(() => of(null))),
        ),
        filter((subscription): subscription is Subscription => subscription !== null),
        tap((subscription) => this.subscriptionSignal.set(subscription)),
        filter((subscription) => subscription.isActive),
        take(1),
        timeout({ first: 60000 }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.activationPendingSignal.set(false)),
      )
      .subscribe({
        error: () => this.activationTimedOutSignal.set(true),
      });
  }

  /**
   * Creates a subscription when necessary and obtains its Checkout session.
   *
   * Existing pending subscriptions must be reused.
   */
  startCheckout(command: CreateSubscriptionCommand): Observable<CheckoutSession> {
    if (this.checkoutLoading() || this.loading() || this.error()) {
      return EMPTY;
    }

    const existingSubscription = this.subscription();

    if (
      existingSubscription &&
      (!existingSubscription.isPending ||
        existingSubscription.accountId !== command.accountId ||
        existingSubscription.planId !== command.planId)
    ) {
      this.checkoutErrorSignal.set('subscriptions.errors.checkout');
      return EMPTY;
    }

    this.checkoutLoadingSignal.set(true);
    this.checkoutErrorSignal.set(null);

    const subscription$ = existingSubscription
      ? of(existingSubscription)
      : this.subscriptionApi.createSubscription(command.accountId, {
          planId: command.planId,
        });

    return subscription$.pipe(
      tap((subscription) => {
        this.subscriptionSignal.set(subscription);
      }),

      switchMap(() => this.subscriptionApi.createCheckoutSession(command.accountId)),

      catchError((error: ApiError) => {
        this.checkoutErrorSignal.set(
          error.status === 409 ? 'subscriptions.errors.conflict' : 'subscriptions.errors.checkout',
        );

        return EMPTY;
      }),

      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.checkoutLoadingSignal.set(false);
      }),
    );
  }

  /**
   * Updates the subscription renewal configuration and waits
   * for the billing state to be synchronized by Stripe webhooks.
   */
  updateCancellation(command: UpdateSubscriptionCancellationCommand): void {
    if (
      this.loading() ||
      this.checkoutLoading() ||
      this.renewalLoading() ||
      this.renewalPending() ||
      this.error()
    ) {
      return;
    }

    const subscription = this.subscription();

    if (!subscription || subscription.accountId !== command.accountId) {
      return;
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
      return;
    }

    if (subscription.cancelAtPeriodEnd === command.cancelAtPeriodEnd) {
      return;
    }

    this.renewalLoadingSignal.set(true);
    this.renewalErrorSignal.set(null);
    this.renewalNoticeSignal.set(null);

    this.subscriptionApi
      .updateSubscriptionCancellation(command.accountId, {
        cancelAtPeriodEnd: command.cancelAtPeriodEnd,
      })
      .pipe(
        switchMap(() => {
          this.renewalPendingSignal.set(true);

          this.renewalNoticeSignal.set('subscriptions.renewal.synchronizing');

          return timer(0, 1500).pipe(
            exhaustMap(() => this.subscriptionApi.getSubscriptionByAccountId(command.accountId)),

            tap((updatedSubscription) => {
              this.subscriptionSignal.set(updatedSubscription);
            }),

            filter(
              (updatedSubscription) =>
                updatedSubscription.cancelAtPeriodEnd === command.cancelAtPeriodEnd,
            ),

            take(1),

            timeout({ first: 15000 }),

            map(() => true),

            catchError(() => of(false)),
          );
        }),

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.renewalLoadingSignal.set(false);
        }),
      )
      .subscribe({
        next: (synchronized) => {
          if (synchronized) {
            this.renewalPendingSignal.set(false);

            this.renewalNoticeSignal.set('subscriptions.renewal.updated');
          } else {
            this.renewalNoticeSignal.set('subscriptions.renewal.syncPending');
          }
        },

        error: () => {
          this.renewalErrorSignal.set('subscriptions.errors.renewal');
        },
      });
  }
}
