/**
 * Represents a veterinary clinic profile.
 *
 * @remarks
 * Contains the institutional information associated
 * with an IAM clinic account.
 */
export class Clinic {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly name: string,
    public readonly ruc: string | null,
    public readonly address: string | null,
    public readonly phoneNumber: string | null,
    public readonly description: string | null,
    public readonly profileImageUrl: string | null,
  ) {}
}
