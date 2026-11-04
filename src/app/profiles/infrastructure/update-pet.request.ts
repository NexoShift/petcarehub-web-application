import type { Species } from '../domain/model/species';
import type { PetSex } from '../domain/model/pet-sex';

/**
 * Request data for updating a pet's information.
 */
export interface UpdatePetRequest {
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
}
