/**
 * Command to schedule or revert the cancellation of a subscription.
 */
export interface UpdateSubscriptionCancellationCommand {
  accountId: number;
  cancelAtPeriodEnd: boolean;
}
