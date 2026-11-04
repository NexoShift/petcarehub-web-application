import type { PersonSex } from './person-sex';

/**
 * Command to update a pet owner's personal information.
 *
 * @remarks
 * Encapsulates the information required to request
 * changes to an existing pet owner profile.
 */
export interface UpdatePetOwnerCommand {
  petOwnerId: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  sex: PersonSex | null;
}
