/**
 * Command to update a veterinary clinic profile.
 *
 * @remarks
 * Represents changes to the institutional information
 * of an existing veterinary clinic.
 */
export interface UpdateClinicCommand {
  clinicId: number;
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
}
