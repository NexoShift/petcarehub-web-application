import type { Species } from '../domain/model/species';
import type { PetSex } from '../domain/model/pet-sex';

/**
 * Request data for registering a pet.
 *
 * @remarks
 * Represents the multipart fields expected by the Profile API.
 */
export interface CreatePetRequest {
  ownerId: number;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
  image: File | null;
}
