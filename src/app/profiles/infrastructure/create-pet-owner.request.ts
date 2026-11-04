import type { PersonSex } from '../domain/model/person-sex';

/**
 * Request data for creating a pet owner profile.
 *
 * @remarks
 * Represents the multipart form fields expected by
 * the Profile API.
 */
export interface CreatePetOwnerRequest {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  image?: File | null;
}
