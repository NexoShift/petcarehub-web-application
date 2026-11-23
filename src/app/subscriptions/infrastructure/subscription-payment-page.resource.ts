import type { SubscriptionPaymentResource } from './subscription-payment.resource';

export interface SubscriptionPaymentPageResource {
  payments: SubscriptionPaymentResource[];
  hasMore: boolean;
  nextCursor: string | null;
}
