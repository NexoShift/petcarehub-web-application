import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam';
import { Icon } from '../../../../shared/presentation/components/icon/icon';

import { SubscriptionStore } from '../../../application/subscription.store';

import { SubscriptionBenefits } from '../../components/subscription-benefits/subscription-benefits';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialog } from '@angular/material/dialog';

import { SubscriptionPaymentHistory } from '../../components/subscription-payment-history/subscription-payment-history';

import {
  SubscriptionRenewalDialog,
  SubscriptionRenewalDialogData,
} from '../../components/subscription-renewal-dialog/subscription-renewal-dialog';

@Component({
  selector: 'app-subscription-management',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    Icon,
    SubscriptionBenefits,
    SubscriptionPaymentHistory,
  ],
  providers: [SubscriptionStore],
  templateUrl: './subscription-management.html',
  styleUrl: './subscription-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionManagement implements OnInit {
  private readonly iamStore = inject(IamStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly store = inject(SubscriptionStore);

  protected readonly checkoutResult = this.route.snapshot.queryParamMap.get('checkout');

  protected readonly navigationError = signal(false);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    const user = this.iamStore.currentUser();

    if (!user) {
      return;
    }

    this.navigationError.set(false);

    this.store.load(user.accountId, user.accountType);
  }

  protected checkout(planId: number): void {
    const user = this.iamStore.currentUser();

    if (!user) {
      return;
    }

    this.navigationError.set(false);

    this.store
      .startCheckout({
        accountId: user.accountId,
        planId,
      })
      .subscribe({
        next: (session) => {
          try {
            const url = new URL(session.checkoutUrl);

            if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') {
              this.navigationError.set(true);
              return;
            }

            window.location.assign(url.toString());
          } catch {
            this.navigationError.set(true);
          }
        },
      });
  }

  protected manageRenewal(): void {
    const subscription = this.store.subscription();

    if (!subscription || this.store.renewalLoading() || this.store.renewalPending()) {
      return;
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
      return;
    }

    const cancelAtPeriodEnd = !subscription.cancelAtPeriodEnd;

    const dialogRef = this.dialog.open<
      SubscriptionRenewalDialog,
      SubscriptionRenewalDialogData,
      boolean
    >(SubscriptionRenewalDialog, {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',

      data: {
        cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isActive: subscription.isActive,
      },
    });

    // @ts-ignore
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return;
        }

        this.store.updateCancellation({
          accountId: subscription.accountId,
          cancelAtPeriodEnd,
        });
      });
  }
}
