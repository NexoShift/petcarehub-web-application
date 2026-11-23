import { SubscriptionEntitlements } from '../domain/model/subscription-entitlements.entity';

import type { SubscriptionEntitlementsResource } from './subscription-entitlements.resource';

/**
 * Converts subscription entitlement resources into domain entities.
 */
export class SubscriptionEntitlementsAssembler {
  static toEntityFromResource(
    resource: SubscriptionEntitlementsResource,
  ): SubscriptionEntitlements {
    return new SubscriptionEntitlements(
      resource.subscriptionId,
      resource.accountId,
      resource.planCode,
      resource.maxPets,
      resource.maxVeterinarians,
      resource.monthlyComputerVisionCredits,
      resource.monthlyLlmCredits,
    );
  }
}
