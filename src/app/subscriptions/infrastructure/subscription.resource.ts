import type { PlanCode } from '../domain/model/plan-code';
import type { SubscriptionStatus } from '../domain/model/subscription-status';

export interface SubscriptionResource {
  id: number;
  accountId: number;
  planId: number;
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
