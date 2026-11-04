/**
 * Resource representation of a veterinarian assignment.
 *
 * @remarks
 * Includes the assignment period and current status
 * to support historical tracking.
 */
export interface ConsultingRoomAssignmentResource {
  id: number;
  consultingRoomId: number;
  veterinarianId: number;
  assignedAt: string;
  unassignedAt: string | null;
  active: boolean;
}
