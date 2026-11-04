import { PetSex } from './pet-sex';
import { Species } from './species';

/**
 * Represents a pet profile.
 */
export class Pet {
  constructor(
    readonly id: number,
    readonly ownerId: number,
    readonly petCode: string,
    readonly name: string,
    readonly species: Species,
    readonly breed: string | null,
    readonly birthDate: string | null,
    readonly sex: PetSex | null,
    readonly profileImageUrl: string | null,
  ) {}
}
