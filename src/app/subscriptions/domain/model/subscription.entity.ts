import { PlanCode } from './plan-code';
import { SubscriptionStatus } from './subscription-status';

/**
 * Represents the subscription associated with an IAM account.
 */
export class Subscription {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly planId: number,
    public readonly planCode: PlanCode,
    public readonly status: SubscriptionStatus,
    public readonly currentPeriodStart: string | null,
    public readonly currentPeriodEnd: string | null,
    public readonly cancelAtPeriodEnd: boolean,
  ) {}

  get isPending(): boolean {
    return this.status === 'PENDING';
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isCanceled(): boolean {
    return this.status === 'CANCELED';
  }

  get isExpired(): boolean {
    return this.status === 'EXPIRED';
  }
}
