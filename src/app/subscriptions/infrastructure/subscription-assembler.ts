import { Subscription } from '../domain/model/subscription.entity';
import type { SubscriptionResource } from './subscription.resource';

/**
 * Converts subscription resources into domain entities.
 */
export class SubscriptionAssembler {
  static toEntityFromResource(resource: SubscriptionResource): Subscription {
    return new Subscription(
      resource.id,
      resource.accountId,
      resource.planId,
      resource.planCode,
      resource.status,
      resource.currentPeriodStart,
      resource.currentPeriodEnd,
      resource.cancelAtPeriodEnd,
    );
  }
}
