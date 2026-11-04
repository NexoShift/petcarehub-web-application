import type { Species } from './species';
import type { PetSex } from './pet-sex';

/**
 * Command to create a pet profile.
 *
 * @remarks
 * Represents the information required to register
 * a pet associated with an existing pet owner.
 */
export interface CreatePetCommand {
  ownerId: number;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
}
