import { ConsultingRoomAssignment } from '../domain/model/consulting-room-assignment.entity';
import type { ConsultingRoomAssignmentResource } from './consulting-room-assignment.resource';

/**
 * Assembler for converting consulting room assignment resources into entities.
 */
export class ConsultingRoomAssignmentAssembler {
  /**
   * Converts an assignment resource into a domain entity.
   *
   * @param resource - The assignment resource received from the API.
   * @returns The consulting room assignment entity.
   */
  static toEntityFromResource(
    resource: ConsultingRoomAssignmentResource,
  ): ConsultingRoomAssignment {
    return new ConsultingRoomAssignment(
      resource.id,
      resource.consultingRoomId,
      resource.veterinarianId,
      resource.assignedAt,
      resource.unassignedAt,
      resource.active,
    );
  }

  /**
   * Converts assignment resources into domain entities.
   */
  static toEntitiesFromResources(
    resources: ConsultingRoomAssignmentResource[],
  ): ConsultingRoomAssignment[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
