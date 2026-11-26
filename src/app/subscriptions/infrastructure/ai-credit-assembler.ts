import { AiCredit } from '../domain/model/ai-credit.entity';
import { CreditBalance } from '../domain/model/credit-balance';

import type { AiCreditResource, CreditBalanceResource } from './ai-credit.resource';

/**
 * Converts AI credit resources into domain entities.
 */
export class AiCreditAssembler {
  static toEntityFromResource(resource: AiCreditResource): AiCredit {
    return new AiCredit(
      resource.subscriptionId,
      resource.accountId,
      resource.periodStart,
      resource.periodEnd,
      this.toCreditBalance(resource.computerVision),
      this.toCreditBalance(resource.llm),
    );
  }

  private static toCreditBalance(resource: CreditBalanceResource): CreditBalance {
    return new CreditBalance(
      resource.limit,
      resource.reserved,
      resource.consumed,
      resource.available,
    );
  }
}
