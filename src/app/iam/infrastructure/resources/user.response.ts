import { AccountType } from '../../domain/model/account-type';
import { Role } from '../../domain/model/role';

export interface UserResponse {
  id: number;
  accountId: number;
  accountType: AccountType;
  email: string;
  accessRole: string;
  status: string;
  roles: Role[];
}
