/**
 * Command to assign a veterinarian to a consulting room.
 *
 * @remarks
 * An existing active assignment is automatically
 * replaced by the backend.
 */
export interface AssignVeterinarianCommand {
  clinicId: number;
  consultingRoomId: number;
  veterinarianId: number;
}
