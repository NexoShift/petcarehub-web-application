import type { PersonSex } from '../domain/model/person-sex';

/**
 * Represents the pet owner data returned by the Profile API.
 */
export interface PetOwnerResource{
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  profileImageUrl: string | null;
}
