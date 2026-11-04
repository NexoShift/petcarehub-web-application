import type { Species } from './species';
import type { PetSex } from './pet-sex';

/**
 * Command to update a pet's profile information.
 *
 * @remarks
 * Encapsulates the information required to modify
 * the personal information of an existing pet.
 */
export interface UpdatePetCommand {
  petId: number;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
}
