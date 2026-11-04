/**
 * Represents a pet registered as a patient of a veterinary clinic.
 *
 * @remarks
 * Associates an existing pet with a clinic and records
 * when the registration took place.
 */
export class ClinicPatient {
  constructor(
    public readonly id: number,
    public readonly clinicId: number,
    public readonly petId: number,
    public readonly registeredAt: string,
  ) {}
}
