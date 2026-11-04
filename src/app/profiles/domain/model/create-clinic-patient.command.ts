/**
 * Command to register an existing pet as a clinic patient.
 */
export interface CreateClinicPatientCommand {
  clinicId: number;
  petId: number;
}
