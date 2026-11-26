import { CheckoutSession } from '../domain/model/checkout-session.entity';
import type { CheckoutSessionResource } from './checkout-session.resource';

/**
 * Converts Stripe Checkout resources into domain entities.
 */
export class CheckoutSessionAssembler {
  static toEntityFromResource(resource: CheckoutSessionResource): CheckoutSession {
    return new CheckoutSession(
      resource.subscriptionId,
      resource.sessionId,
      resource.checkoutUrl,
      resource.expiresAt,
    );
  }
}
