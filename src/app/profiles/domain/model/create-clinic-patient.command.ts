/**
 * Command to register an existing pet as a clinic patient.
 */
export interface CreateClinicPatientCommand {
  clinicId: number;
  petId: number;
  /** Código que el dueño comparte con la clínica: es su consentimiento para registrarla. */
  petCode: string;
}
