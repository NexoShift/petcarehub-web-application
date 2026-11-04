import type { PersonSex } from './person-sex';

/**
 * Command to create a veterinarian profile.
 *
 * @remarks
 * Encapsulates the personal and professional information
 * required to register a veterinarian associated with
 * an existing clinic.
 */
export interface CreateVeterinarianCommand {
  userId: number;
  clinicId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  licenseNumber: string | null;
  specialty: string | null;
}
