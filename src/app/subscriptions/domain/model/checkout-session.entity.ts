/**
 * Represents a Stripe Checkout session associated with a subscription.
 */
export class CheckoutSession {
  constructor(
    public readonly subscriptionId: number,
    public readonly sessionId: string,
    public readonly checkoutUrl: string,
    public readonly expiresAt: string,
  ) {}
}
