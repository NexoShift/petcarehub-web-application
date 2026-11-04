/**
 * Request data for registering a veterinary clinic.
 *
 * @remarks
 * Represents the multipart fields required by the Profile API.
 */
export interface CreateClinicRequest {
  accountId: number;
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
  image: File | null;
}
