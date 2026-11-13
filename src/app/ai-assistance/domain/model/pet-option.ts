/**
 * Mascota que se puede elegir en la pantalla de visión.
 * Es un modelo de lectura de este contexto: los datos vienen de Profiles (y de Clinical Attention
 * para la consulta en curso), pero aquí solo guardamos lo que la pantalla necesita.
 */
export interface PetOption {
  id: number;
  name: string;
  /** Clave de enums.species (DOG, CAT, OTHER). */
  species: 'DOG' | 'CAT' | 'OTHER';
  breed: string;
  ageYears: number;
  /** Solo para el vet: consulta en curso con esta mascota, para precargar el campo. */
  activeConsultationId?: number;
  /** Solo para el vet: nombre del tutor. */
  ownerName?: string;
}
