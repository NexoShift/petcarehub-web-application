import { PlanCode } from './plan-code';
import { PlanType } from './plan-type';
import { SubscriberType } from './subscriber-type';

/**
 * Represents a subscription plan and its associated benefits.
 */
export class Plan {
  constructor(
    public readonly id: number,
    public readonly code: PlanCode,
    public readonly name: string,
    public readonly subscriberType: SubscriberType,
    public readonly planType: PlanType,
    public readonly monthlyPrice: number,
    public readonly currency: string,
    public readonly maxPets: number | null,
    public readonly maxVeterinarians: number | null,
    public readonly monthlyComputerVisionCredits: number,
    public readonly monthlyLlmCredits: number,
  ) {}

  get isPremium(): boolean {
    return this.planType === 'PREMIUM';
  }
}
