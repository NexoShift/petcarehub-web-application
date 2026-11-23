export interface SubscriptionPaymentResource {
  invoiceId: string;
  invoiceNumber: string | null;
  amountPaid: number;
  currency: string;
  status: 'PAID';
  paidAt: string | null;
  invoiceUrl: string | null;
  invoicePdfUrl: string | null;
}
