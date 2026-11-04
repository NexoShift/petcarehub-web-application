/**
 * Command to delete a consulting room.
 *
 * @remarks
 * Deletion is only permitted when the room
 * has no veterinarian assignment history.
 */
export interface DeleteConsultingRoomCommand {
  clinicId: number;
  consultingRoomId: number;
}
