import type { Species } from '../domain/model/species';

/**
 * Resource representation of a pet search result.
 *
 * @remarks
 * Contains the information returned when searching
 * for an existing pet using its unique pet code.
 */
export interface PetSearchResource {
  id: number;
  petCode: string;
  name: string;
  species: Species;
  breed: string | null;
}
