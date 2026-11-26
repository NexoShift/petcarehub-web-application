import type { PlanCode } from './plan-code';

/**
 * Represents the benefits and registration limits of a subscription.
 */
export class SubscriptionEntitlements {
  constructor(
    public readonly subscriptionId: number,
    public readonly accountId: number,
    public readonly planCode: PlanCode,
    public readonly maxPets: number | null,
    public readonly maxVeterinarians: number | null,
    public readonly monthlyComputerVisionCredits: number,
    public readonly monthlyLlmCredits: number,
  ) {}
}
