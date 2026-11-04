import type { PersonSex } from '../domain/model/person-sex';

/**
 * Request data for updating a veterinarian profile.
 */
export interface UpdateVeterinarianRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  licenseNumber: string | null;
  specialty: string | null;
}
