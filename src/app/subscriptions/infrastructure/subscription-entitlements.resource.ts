import type { PlanCode } from '../domain/model/plan-code';

export interface SubscriptionEntitlementsResource {
  subscriptionId: number;
  accountId: number;
  planCode: PlanCode;
  maxPets: number | null;
  maxVeterinarians: number | null;
  monthlyComputerVisionCredits: number;
  monthlyLlmCredits: number;
}
