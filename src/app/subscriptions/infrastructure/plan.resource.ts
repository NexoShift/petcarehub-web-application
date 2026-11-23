import type { PlanCode } from '../domain/model/plan-code';
import type { PlanType } from '../domain/model/plan-type';
import type { SubscriberType } from '../domain/model/subscriber-type';

export interface PlanResource {
  id: number;
  code: PlanCode;
  name: string;
  subscriberType: SubscriberType;
  planType: PlanType;
  monthlyPrice: number;
  currency: string;
  maxPets: number | null;
  maxVeterinarians: number | null;
  monthlyComputerVisionCredits: number;
  monthlyLlmCredits: number;
}
