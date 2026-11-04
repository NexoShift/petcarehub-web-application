import { Veterinarian } from '../domain/model/veterinarian.entity';
import type { VeterinarianResource } from './veterinarian.resource';

/**
 * Assembler for converting veterinarian API resources into domain entities.
 */
export class VeterinarianAssembler {
  /**
   * Converts a veterinarian resource into a domain entity.
   *
   * @param resource - The veterinarian resource received from the API.
   * @returns The veterinarian entity.
   */
  static toEntityFromResource(resource: VeterinarianResource): Veterinarian {
    return new Veterinarian(
      resource.id,
      resource.userId,
      resource.clinicId,
      resource.firstName,
      resource.lastName,
      resource.email,
      resource.phoneNumber,
      resource.sex,
      resource.licenseNumber,
      resource.specialty,
      resource.profileImageUrl,
    );
  }

  /**
   * Converts a collection of veterinarian resources into domain entities.
   */
  static toEntitiesFromResources(resources: VeterinarianResource[]): Veterinarian[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
