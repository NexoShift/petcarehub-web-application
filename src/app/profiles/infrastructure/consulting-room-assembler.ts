import { ConsultingRoom } from '../domain/model/consulting-room.entity';
import type { ConsultingRoomResource } from './consulting-room.resource';

/**
 * Assembler for converting consulting room API resources into domain entities.
 */
export class ConsultingRoomAssembler {
  /**
   * Converts a consulting room resource into a domain entity.
   *
   * @param resource - The consulting room resource received from the API.
   * @returns The consulting room entity.
   */
  static toEntityFromResource(resource: ConsultingRoomResource): ConsultingRoom {
    return new ConsultingRoom(resource.id, resource.name, resource.description, resource.active);
  }

  /**
   * Converts consulting room resources into domain entities.
   */
  static toEntitiesFromResources(resources: ConsultingRoomResource[]): ConsultingRoom[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
