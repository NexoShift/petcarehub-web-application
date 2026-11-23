import { CreditBalance } from './credit-balance';

/**
 * Represents the independent AI credit balances of a subscription
 * during its current billing period.
 */
export class AiCredit {
  constructor(
    public readonly subscriptionId: number,
    public readonly accountId: number,
    public readonly periodStart: string,
    public readonly periodEnd: string,
    public readonly computerVision: CreditBalance,
    public readonly llm: CreditBalance,
  ) {}
}
