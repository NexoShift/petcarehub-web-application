/**
 * Request data for updating a veterinary clinic.
 */
export interface UpdateClinicRequest {
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
}
