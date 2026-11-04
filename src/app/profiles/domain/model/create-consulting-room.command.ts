/**
 * Command to create a consulting room within a clinic.
 */
export interface CreateConsultingRoomCommand {
  clinicId: number;
  name: string;
  description: string | null;
}
