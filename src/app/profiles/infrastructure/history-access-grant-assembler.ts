import { HistoryAccessGrant, HistoryAccessStatus } from '../domain/model/history-access-grant.entity';
import type { HistoryAccessGrantResource } from './history-access-grant.resource';

const STATUSES: HistoryAccessStatus[] = ['ACTIVE', 'EXPIRED', 'REVOKED'];

export class HistoryAccessGrantAssembler {
  static toEntityFromResource(resource: HistoryAccessGrantResource): HistoryAccessGrant {
    const status = STATUSES.includes(resource.status as HistoryAccessStatus)
      ? (resource.status as HistoryAccessStatus)
      : 'EXPIRED';
    return new HistoryAccessGrant(
      resource.id,
      resource.petId,
      resource.clinicId,
      new Date(resource.grantedAt),
      new Date(resource.expiresAt),
      resource.revokedAt ? new Date(resource.revokedAt) : null,
      status,
    );
  }

  static toEntitiesFromResources(resources: HistoryAccessGrantResource[]): HistoryAccessGrant[] {
    return resources.map((r) => HistoryAccessGrantAssembler.toEntityFromResource(r));
  }
}
