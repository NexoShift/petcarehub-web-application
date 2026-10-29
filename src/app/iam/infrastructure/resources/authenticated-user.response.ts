import { AccountType} from '../../domain/model/account-type';
import { Role } from '../../domain/model/role';

export interface AuthenticatedUserResponse {
  userId: number;
  accountId: number;
  accountType: AccountType;
  email: string;
  roles: Role[];
  token: string;
}
