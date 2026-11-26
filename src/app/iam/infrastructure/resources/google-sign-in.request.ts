import type { AccountType } from '../../domain/model/account-type';

/** POST /authentication/google-sign-in. accountType solo al crear la cuenta. */
export interface GoogleSignInRequest {
  idToken: string;
  accountType?: AccountType;
}
