import { SubscriptionPayment } from './subscription-payment.entity';

/**
 * Represents a paginated subscription payment history.
 */
export class SubscriptionPaymentPage {
  constructor(
    public readonly payments: SubscriptionPayment[],
    public readonly hasMore: boolean,
    public readonly nextCursor: string | null,
  ) {}
}
