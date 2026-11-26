import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';

import { DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../../../../shared/presentation/components/icon/icon';

import { SubscriptionBenefitsStore } from '../../../application/subscription-benefits.store';

@Component({
  selector: 'app-subscription-benefits',
  imports: [
    DatePipe,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    Icon,
  ],
  providers: [SubscriptionBenefitsStore],
  templateUrl: './subscription-benefits.html',
  styleUrl: './subscription-benefits.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionBenefits {
  readonly accountId = input.required<number>();

  protected readonly store = inject(SubscriptionBenefitsStore);

  protected readonly creditCards = computed(() => {
    const credits = this.store.aiCredits();

    if (!credits) {
      return [];
    }

    return [
      {
        titleKey: 'subscriptions.credits.computerVision',
        icon: 'scan' as const,
        balance: credits.computerVision,
      },
      {
        titleKey: 'subscriptions.credits.llm',
        icon: 'sparkles' as const,
        balance: credits.llm,
      },
    ];
  });

  constructor() {
    effect(() => {
      this.store.load(this.accountId());
    });
  }

  protected reload(): void {
    this.store.load(this.accountId());
  }
}
