import type { PersonSex } from './person-sex';

/**
 * Represents a veterinarian's professional profile.
 *
 * @remarks
 * Contains personal and professional information
 * associated with an IAM user and a veterinary clinic.
 */
export class Veterinarian {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly clinicId: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly phoneNumber: string | null,
    public readonly sex: PersonSex | null,
    public readonly licenseNumber: string | null,
    public readonly specialty: string | null,
    public readonly profileImageUrl: string | null,
  ) {}

  /**
   * Returns the veterinarian's full name.
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
