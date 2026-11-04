/**
 * Resource representation of a pet registered as a clinic patient.
 */
export interface ClinicPatientResource {
  id: number;
  clinicId: number;
  petId: number;
  registeredAt: string;
}
