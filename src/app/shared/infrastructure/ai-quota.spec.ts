import { CreditBalance } from '../../subscriptions/domain/model/credit-balance';
import { AiCredit } from '../../subscriptions/domain/model/ai-credit.entity';
import { toAiQuota } from './dashboard.api';

describe('toAiQuota', () => {
  const credits = new AiCredit(
    14, 14, '2026-11-25T14:33:44Z', '2026-12-25T14:33:44Z',
    new CreditBalance(40, 1, 2, 37),
    new CreditBalance(150, 0, 150, 0),
  );

  it('maps the AI credits of the period, LLM first', () => {
    const quota = toAiQuota('Premium', credits, new Date('2026-11-30T12:00:00Z'));
    expect(quota.plan).toBe('Premium');
    expect([quota.periodStart, quota.periodEnd]).toEqual(['2026-11-25', '2026-12-25']);
    expect(quota.renewsInDays).toBe(26);
    expect(quota.usages.map((u) => [u.kind, u.used, u.limit, u.left])).toEqual([
      ['llm', 150, 150, 0],
      ['vision', 3, 40, 37],
    ]);
    expect(quota.usages[0].label).toBe('dashboard.owner.usage.llm');
  });

  it('never shows a negative renewal', () => {
    expect(toAiQuota('', credits, new Date('2027-01-10T00:00:00Z')).renewsInDays).toBe(0);
  });
});
