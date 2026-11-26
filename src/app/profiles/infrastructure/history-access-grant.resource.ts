/** GET /pets/{petId}/history-access-grants */
export interface HistoryAccessGrantResource {
  id: number;
  petId: number;
  clinicId: number;
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: string;
}
