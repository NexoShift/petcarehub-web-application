import { AccountType } from './account-type';
import { Role } from './role';

export class User {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly accountType: AccountType,
    public readonly email: string,
    public readonly roles: Role[],
  ) {}

  hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }

  get isVeterinarian(): boolean {
    return this.hasRole('ROLE_VETERINARIAN');
  }

  get isPetOwner(): boolean {
    return this.hasRole('ROLE_PET_OWNER');
  }
}
