import { SubscriptionPayment } from '../domain/model/subscription-payment.entity';

import { SubscriptionPaymentPage } from '../domain/model/subscription-payment-page';

import type { SubscriptionPaymentResource } from './subscription-payment.resource';

import type { SubscriptionPaymentPageResource } from './subscription-payment-page.resource';

/**
 * Converts subscription payment resources into domain entities.
 */
export class SubscriptionPaymentAssembler {
  static toEntityFromResource(resource: SubscriptionPaymentResource): SubscriptionPayment {
    return new SubscriptionPayment(
      resource.invoiceId,
      resource.invoiceNumber,
      resource.amountPaid,
      resource.currency,
      resource.status,
      resource.paidAt,
      resource.invoiceUrl,
      resource.invoicePdfUrl,
    );
  }

  static toPageFromResource(resource: SubscriptionPaymentPageResource): SubscriptionPaymentPage {
    return new SubscriptionPaymentPage(
      resource.payments.map((payment) => this.toEntityFromResource(payment)),
      resource.hasMore,
      resource.nextCursor,
    );
  }
}
