import type { PersonSex } from '../domain/model/person-sex';

/**
 * Resource representation of a veterinarian profile.
 */
export interface VeterinarianResource {
  id: number;
  userId: number;
  clinicId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  licenseNumber: string | null;
  specialty: string | null;
  profileImageUrl: string | null;
}
