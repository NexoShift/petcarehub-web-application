/**
 * Command to create a veterinary clinic profile.
 *
 * @remarks
 * Encapsulates the institutional information required
 * to register a clinic associated with an IAM account.
 */
export interface CreateClinicCommand {
  accountId: number;
  name: string;
  ruc: string | null;
  address: string | null;
  phoneNumber: string | null;
  description: string | null;
}
