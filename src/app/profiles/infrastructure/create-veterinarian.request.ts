import type { PersonSex } from '../domain/model/person-sex';

/**
 * Request data for registering a veterinarian profile.
 *
 * @remarks
 * Represents the multipart fields expected by the Profile API.
 */
export interface CreateVeterinarianRequest {
  userId: number;
  clinicId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  licenseNumber: string | null;
  specialty: string | null;
  image: File | null;
}
