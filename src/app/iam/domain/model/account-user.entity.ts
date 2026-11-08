import type { Role } from './role';

/**
 * Represents an IAM user belonging to an account.
 *
 * Includes administrative information that is not
 * required by the authenticated session model.
 */
export class AccountUser {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly email: string,
    public readonly accessRole: string,
    public readonly status: string,
    public readonly roles: Role[],
    public readonly mustChangePassword: boolean,
  ) {}

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isHolder(): boolean {
    return this.accessRole === 'HOLDER';
  }
}
