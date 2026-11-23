import { Plan } from '../domain/model/plan.entity';
import type { PlanResource } from './plan.resource';

/**
 * Converts subscription plan resources into domain entities.
 */
export class PlanAssembler {
  static toEntityFromResource(resource: PlanResource): Plan {
    return new Plan(
      resource.id,
      resource.code,
      resource.name,
      resource.subscriberType,
      resource.planType,
      resource.monthlyPrice,
      resource.currency,
      resource.maxPets,
      resource.maxVeterinarians,
      resource.monthlyComputerVisionCredits,
      resource.monthlyLlmCredits,
    );
  }

  static toEntitiesFromResources(resources: PlanResource[]): Plan[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
