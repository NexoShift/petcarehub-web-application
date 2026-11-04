import type { Species } from '../domain/model/species';
import type { PetSex } from '../domain/model/pet-sex';

/**
 * Resource representation of a pet profile.
 */
export interface PetResource {
  id: number;
  ownerId: number;
  petCode: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex | null;
  profileImageUrl: string | null;
}
