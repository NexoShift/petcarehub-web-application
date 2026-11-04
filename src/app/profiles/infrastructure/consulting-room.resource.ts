/**
 * Resource representation of a veterinary consulting room.
 */
export interface ConsultingRoomResource {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}
