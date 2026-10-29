import { User } from '../domain/model/user-entity';
import { AuthenticatedUserResponse} from './resources/authenticated-user.response';
import { UserResponse} from './resources/user.response';

export class UserAssembler {
  static fromUserResponse(r: UserResponse): User {
    return new User(r.id, r.accountId,r.accountType, r.email,r.roles);
  }
  static fromAuthenticatedResponse(r: AuthenticatedUserResponse): User {
    return new User(r.userId, r.accountId, r.accountType, r.email, r.roles);
  }
}
