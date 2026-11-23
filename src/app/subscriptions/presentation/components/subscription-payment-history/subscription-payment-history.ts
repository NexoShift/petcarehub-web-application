import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';

import { CurrencyPipe, DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

import { SubscriptionPaymentStore } from '../../../application/subscription-payment.store';

@Component({
  selector: 'app-subscription-payment-history',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatProgressSpinnerModule, TranslatePipe, Icon],
  providers: [SubscriptionPaymentStore],
  templateUrl: './subscription-payment-history.html',
  styleUrl: './subscription-payment-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPaymentHistory {
  readonly accountId = input.required<number>();

  protected readonly store = inject(SubscriptionPaymentStore);

  constructor() {
    effect(() => {
      this.store.load(this.accountId());
    });
  }

  protected reload(): void {
    this.store.load(this.accountId());
  }

  protected loadMore(): void {
    this.store.loadMore();
  }

  /**
   * Validates Stripe document URLs before exposing them as links.
   */
  protected stripeLink(value: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);

      const validHost = url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com');

      if (url.protocol !== 'https:' || !validHost || url.username || url.password) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }
}
