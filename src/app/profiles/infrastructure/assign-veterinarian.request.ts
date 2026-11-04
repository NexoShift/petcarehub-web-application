/**
 * Request data for assigning a veterinarian to a consulting room.
 */
export interface AssignVeterinarianRequest {
  consultingRoomId: number;
  veterinarianId: number;
}
