import { User } from '../domain/model/user.entity';
import { AuthenticatedUserResponse } from './resources/authenticated-user.response';
import { UserResponse } from './resources/user.response';
import { AccountUser } from '../domain/model/account-user.entity';

export class UserAssembler {
  static fromUserResponse(r: UserResponse): User {
    return new User(
      r.id,
      r.accountId,
      r.accountType,
      r.email,
      r.roles,
      r.mustChangePassword ?? false,
    );
  }

  static fromAuthenticatedResponse(r: AuthenticatedUserResponse): User {
    return new User(
      r.userId,
      r.accountId,
      r.accountType,
      r.email,
      r.roles,
      r.mustChangePassword ?? false,
    );
  }


  /**
   * Converts an account user response into an administrative user entity.
   */
  static fromAccountUserResponse(response: UserResponse): AccountUser {
    return new AccountUser(
      response.id,
      response.accountId,
      response.email,
      response.accessRole,
      response.status,
      response.roles,
      response.mustChangePassword
    );
  }
}
