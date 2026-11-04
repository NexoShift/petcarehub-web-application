import { PetOwner } from '../domain/model/pet-owner.entity';
import { PetOwnerResource } from './pet-owner.response';

/**
 * Assembler for converting between pet owner entities and API resources.
 */
export class PetOwnerAssembler {
  /**
   * Converts a pet owner resource into a domain entity.
   *
   * @param resource - The pet owner resource received from the API.
   * @returns The pet owner entity.
   */
  static toEntityFromResource(resource: PetOwnerResource): PetOwner {
    return new PetOwner(
      resource.id,
      resource.userId,
      resource.firstName,
      resource.lastName,
      resource.email,
      resource.phoneNumber,
      resource.sex,
      resource.profileImageUrl,
    );
  }

  /**
   * Converts a pet owner entity into an API resource.
   *
   * @param entity - The pet owner entity.
   * @returns The pet owner resource.
   */
  static toResourceFromEntity(entity: PetOwner): PetOwnerResource {
    return {
      id: entity.id,
      userId: entity.userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      sex: entity.sex,
      profileImageUrl: entity.profileImageUrl,
    };
  }
}
