
import { PersonSex } from './person-sex';

/**
 * Represents a pet owner profile.
 */
export class PetOwner {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly firstName: string,
    readonly lastName: string,
    readonly email: string,
    readonly phoneNumber: string | null,
    readonly sex: PersonSex | null,
    readonly profileImageUrl: string | null,
  ) {}

  /**
   * Returns the pet owner's full name.
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

