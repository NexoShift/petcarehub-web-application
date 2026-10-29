import { AccountType} from '../../domain/model/account-type';

export interface SignUpRequest {
  email: string;
  password: string;
  accountType: AccountType;
}
