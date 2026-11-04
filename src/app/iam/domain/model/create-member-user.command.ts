/**
 * Command for creating a member within a clinic account.
 */
export interface CreateMemberUserCommand {
  accountId: number;
  email: string;
  password: string;
}
