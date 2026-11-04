/**
 * Represents a consulting room belonging to a veterinary clinic.
 *
 * @remarks
 * Contains the room's descriptive information and
 * its current availability status.
 */
export class ConsultingRoom {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly active: boolean,
  ) {}
}
