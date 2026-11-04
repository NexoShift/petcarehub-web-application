import { Pet } from '../domain/model/pet.entity';
import type { PetResource } from './pet.resource';

/**
 * Assembler for converting between pet entities and API resources.
 */
export class PetAssembler {
  /**
   * Converts a pet resource into a domain entity.
   *
   * @param resource - The pet resource received from the API.
   * @returns The pet entity.
   */
  static toEntityFromResource(resource: PetResource): Pet {
    return new Pet(
      resource.id,
      resource.ownerId,
      resource.petCode,
      resource.name,
      resource.species,
      resource.breed,
      resource.birthDate,
      resource.sex,
      resource.profileImageUrl,
    );
  }

  /**
   * Converts a collection of pet resources into domain entities.
   *
   * @param resources - The pet resources received from the API.
   * @returns The pet entities.
   */
  static toEntitiesFromResources(resources: PetResource[]): Pet[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}
