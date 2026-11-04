/**
 * Command to end an active consulting room assignment.
 *
 * @remarks
 * The assignment remains stored for historical tracking.
 */
export interface UnassignVeterinarianCommand {
  clinicId: number;
  assignmentId: number;
}
