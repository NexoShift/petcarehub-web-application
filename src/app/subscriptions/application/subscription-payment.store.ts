import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { finalize } from 'rxjs';

import type { Subscription } from 'rxjs';

import { SubscriptionPayment } from '../domain/model/subscription-payment.entity';

import { SubscriptionApi } from '../infrastructure/subscription-api';

/**
 * Manages subscription payment history and cursor-based pagination.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionPaymentStore {
  private readonly subscriptionApi = inject(SubscriptionApi);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pageSize = 10;

  private accountId: number | null = null;

  private request?: Subscription;

  // State
  private readonly paymentsSignal = signal<SubscriptionPayment[]>([]);

  private readonly loadingSignal = signal(false);

  private readonly loadedSignal = signal(false);

  private readonly errorSignal = signal(false);

  private readonly nextCursorSignal = signal<string | null>(null);

  // Read-only state
  readonly payments = this.paymentsSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();

  readonly loaded = this.loadedSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();

  // Derived state
  readonly hasMore = computed(() => this.nextCursorSignal() !== null);

  /**
   * Loads the first page of payment history.
   */
  load(accountId: number): void {
    this.request?.unsubscribe();

    this.accountId = accountId;

    this.paymentsSignal.set([]);
    this.nextCursorSignal.set(null);
    this.loadedSignal.set(false);
    this.errorSignal.set(false);

    this.requestPage(accountId, null);
  }

  /**
   * Loads the next page of payment history.
   */
  loadMore(): void {
    const accountId = this.accountId;
    const cursor = this.nextCursorSignal();

    if (accountId === null || cursor === null || this.loading()) {
      return;
    }

    this.requestPage(accountId, cursor);
  }

  /**
   * Retrieves a page and appends its payments to the current history.
   */
  private requestPage(accountId: number, startingAfter: string | null): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(false);

    this.request = this.subscriptionApi
      .getSubscriptionPayments(accountId, this.pageSize, startingAfter)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loadingSignal.set(false);
        }),
      )
      .subscribe({
        next: (page) => {
          this.paymentsSignal.update((currentPayments) => {
            const payments = new Map(
              currentPayments.map((payment) => [payment.invoiceId, payment]),
            );

            for (const payment of page.payments) {
              payments.set(payment.invoiceId, payment);
            }

            return [...payments.values()];
          });

          this.nextCursorSignal.set(
            page.hasMore && page.nextCursor !== null && page.nextCursor !== startingAfter
              ? page.nextCursor
              : null,
          );

          this.loadedSignal.set(true);
        },

        error: () => {
          this.errorSignal.set(true);
        },
      });
  }
}
