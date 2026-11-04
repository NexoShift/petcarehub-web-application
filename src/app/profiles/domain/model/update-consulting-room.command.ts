/**
 * Command to update a consulting room's information.
 */
export interface UpdateConsultingRoomCommand {
  clinicId: number;
  consultingRoomId: number;
  name: string;
  description: string | null;
}
