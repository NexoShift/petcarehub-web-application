import type { PersonSex } from './person-sex';

/**
 * Command to update a veterinarian's professional profile.
 *
 * @remarks
 * Represents changes to the personal and professional
 * information of an existing veterinarian.
 */
export interface UpdateVeterinarianCommand {
  veterinarianId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
  licenseNumber: string | null;
  specialty: string | null;
}
