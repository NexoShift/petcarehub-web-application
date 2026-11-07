import { AccountType } from './account-type';
import { Role } from './role';

export class User {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly accountType: AccountType,
    public readonly email: string,
    public readonly roles: Role[],
    /** true mientras el usuario tenga la contraseña temporal que le creó el admin de la clínica. */
    public readonly mustChangePassword = false,
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

  get isClinicAdmin(): boolean {
    return this.hasRole('ROLE_CLINIC_ADMIN');
  }

  /** Copia del usuario después de cambiar su contraseña temporal. */
  withPasswordChanged(): User {
    return new User(this.id, this.accountId, this.accountType, this.email, this.roles, false);
  }
}
