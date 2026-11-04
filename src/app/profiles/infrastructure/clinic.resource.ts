/**
 * Resource representation of a veterinary clinic profile.
 */
export interface ClinicResource {
  id: number;
  accountId: number;
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
  profileImageUrl: string | null;
}
