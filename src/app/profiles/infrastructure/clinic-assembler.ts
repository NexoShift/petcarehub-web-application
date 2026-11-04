import { Clinic } from '../domain/model/clinic.entity';
import type { ClinicResource } from './clinic.resource';

/**
 * Assembler for converting clinic API resources into domain entities.
 */
export class ClinicAssembler {
  /**
   * Converts a clinic resource into a domain entity.
   *
   * @param resource - The clinic resource received from the API.
   * @returns The clinic entity.
   */
  static toEntityFromResource(resource: ClinicResource): Clinic {
    return new Clinic(
      resource.id,
      resource.accountId,
      resource.name,
      resource.ruc,
      resource.address,
      resource.phoneNumber,
      resource.description,
      resource.profileImageUrl,
    );
  }

  /**
   * Converts a collection of clinic resources into domain entities.
   */
  static toEntitiesFromResources(resources: ClinicResource[]): Clinic[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
