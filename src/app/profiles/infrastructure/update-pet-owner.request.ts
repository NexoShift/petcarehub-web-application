import type { PersonSex } from '../domain/model/person-sex';

/**
 * Request data for updating a pet owner's profile.
 */
export interface UpdatePetOwnerRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
}
