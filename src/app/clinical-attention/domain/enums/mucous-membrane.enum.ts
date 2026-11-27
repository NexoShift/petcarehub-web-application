/**
 * Common findings when examining the mucous membranes. The backend stores free text (up to 100
 * characters), so each value is the clinical text itself: it stays readable for other clients and
 * matches records typed before this list existed.
 */
export enum MucousMembrane {
  PINK = 'Rosadas',
  PALE = 'Pálidas',
  CYANOTIC = 'Cianóticas',
  ICTERIC = 'Ictéricas',
  CONGESTED = 'Congestivas',
  PETECHIAE = 'Con petequias',
}
