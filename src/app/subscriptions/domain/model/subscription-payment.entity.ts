/**
 * Represents a paid invoice associated with a subscription.
 */
export class SubscriptionPayment {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string | null,
    public readonly amountPaid: number,
    public readonly currency: string,
    public readonly status: 'PAID',
    public readonly paidAt: string | null,
    public readonly invoiceUrl: string | null,
    public readonly invoicePdfUrl: string | null,
  ) {}
}
