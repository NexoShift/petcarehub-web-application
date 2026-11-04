/**
 * Represents a veterinarian assignment to a consulting room.
 *
 * @remarks
 * Stores the assignment period and its current status,
 * preserving historical assignments after unassignment.
 */
export class ConsultingRoomAssignment {
  constructor(
    public readonly id: number,
    public readonly consultingRoomId: number,
    public readonly veterinarianId: number,
    public readonly assignedAt: string,
    public readonly unassignedAt: string | null,
    public readonly active: boolean,
  ) {}
}
