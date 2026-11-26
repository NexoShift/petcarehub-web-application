import { HistoryAccessGrantAssembler } from '../../infrastructure/history-access-grant-assembler';
import { HistoryAccessGrant } from './history-access-grant.entity';

const now = new Date('2026-11-26T12:00:00Z');
const grant = (status: 'ACTIVE' | 'EXPIRED' | 'REVOKED', hoursFromNow: number) =>
  new HistoryAccessGrant(1, 7, 2, new Date('2026-11-25T10:00:00Z'), new Date(now.getTime() + hoursFromNow * 3_600_000), null, status);

describe('HistoryAccessGrant', () => {
  it('is active only while ACTIVE and not past its expiry', () => {
    expect(grant('ACTIVE', 5).isActiveAt(now)).toBe(true);
    expect(grant('ACTIVE', 5).hoursLeftAt(now)).toBe(5);
    expect(grant('ACTIVE', -1).isActiveAt(now)).toBe(false);
    expect(grant('REVOKED', 5).hoursLeftAt(now)).toBe(0);
  });

  it('maps the resource and treats an unknown status as expired', () => {
    const entity = HistoryAccessGrantAssembler.toEntityFromResource({
      id: 3, petId: 7, clinicId: 2, grantedAt: '2026-11-25T10:00:00Z',
      expiresAt: '2026-11-25T14:00:00Z', revokedAt: null, status: 'SOMETHING',
    });
    expect(entity.status).toBe('EXPIRED');
    expect(entity.expiresAt.toISOString()).toBe('2026-11-25T14:00:00.000Z');
    expect(entity.revokedAt).toBeNull();
  });
});
