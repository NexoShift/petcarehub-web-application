export interface CreditBalanceResource {
  limit: number;
  reserved: number;
  consumed: number;
  available: number;
}

export interface AiCreditResource {
  subscriptionId: number;
  accountId: number;
  periodStart: string;
  periodEnd: string;
  computerVision: CreditBalanceResource;
  llm: CreditBalanceResource;
}
