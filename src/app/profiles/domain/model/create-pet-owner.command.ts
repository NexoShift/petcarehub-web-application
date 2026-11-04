import type { PersonSex } from './person-sex';

/**
 * Command to create a pet owner profile.
 *
 * @remarks
 * Represents the information required to request the
 * registration of a pet owner within the Profile
 * bounded context.
 */
export interface CreatePetOwnerCommand {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
}
