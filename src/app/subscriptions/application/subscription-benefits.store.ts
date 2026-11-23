import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catchError, finalize, forkJoin, of } from 'rxjs';

import type { Subscription } from 'rxjs';

import { SubscriptionEntitlements } from '../domain/model/subscription-entitlements.entity';

import { AiCredit } from '../domain/model/ai-credit.entity';

import { SubscriptionApi } from '../infrastructure/subscription-api';

/**
 * Manages subscription entitlements and AI credit balances.
 */
@Injectable({
  providedIn: 'root',
})
export class SubscriptionBenefitsStore {
  private readonly subscriptionApi = inject(SubscriptionApi);
  private readonly destroyRef = inject(DestroyRef);

  private request?: Subscription;

  // State
  private readonly entitlementsSignal = signal<SubscriptionEntitlements | null>(null);

  private readonly aiCreditsSignal = signal<AiCredit | null>(null);

  private readonly loadingSignal = signal(false);

  private readonly entitlementsErrorSignal = signal(false);

  private readonly aiCreditsErrorSignal = signal(false);

  // Read-only state
  readonly entitlements = this.entitlementsSignal.asReadonly();

  readonly aiCredits = this.aiCreditsSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();

  readonly entitlementsError = this.entitlementsErrorSignal.asReadonly();

  readonly aiCreditsError = this.aiCreditsErrorSignal.asReadonly();

  /**
   * Loads the subscription benefits and independent AI credit balances.
   */
  load(accountId: number): void {
    this.request?.unsubscribe();

    this.loadingSignal.set(true);

    this.entitlementsSignal.set(null);
    this.aiCreditsSignal.set(null);

    this.entitlementsErrorSignal.set(false);
    this.aiCreditsErrorSignal.set(false);

    this.request = forkJoin({
      entitlements: this.subscriptionApi.getSubscriptionEntitlements(accountId).pipe(
        catchError(() => {
          this.entitlementsErrorSignal.set(true);
          return of(null);
        }),
      ),

      aiCredits: this.subscriptionApi.getAiCredits(accountId).pipe(
        catchError(() => {
          this.aiCreditsErrorSignal.set(true);
          return of(null);
        }),
      ),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe(({ entitlements, aiCredits }) => {
        this.entitlementsSignal.set(entitlements);
        this.aiCreditsSignal.set(aiCredits);
      });
  }
}
