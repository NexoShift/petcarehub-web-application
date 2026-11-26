import { planProblemOf } from './plan-required.interceptor';

describe('planProblemOf', () => {
  it('recognizes the plan notices', () => {
    expect(planProblemOf(403, 'An active subscription is required')).toBe('noPlan');
    expect(planProblemOf(409, 'The maximum number of pets allowed by the subscription plan has been reached. Registered: 2. Limit: 2.')).toBe('limit');
    expect(planProblemOf(409, 'No available credits for LLM')).toBe('credits');
    expect(planProblemOf(403, 'The current subscription plan does not include veterinarian registration.')).toBe('notIncluded');
  });

  it('ignores other 403 and 409 errors', () => {
    expect(planProblemOf(403, 'Forbidden')).toBeNull();
    expect(planProblemOf(409, 'Pet already registered')).toBeNull();
    expect(planProblemOf(500, undefined)).toBeNull();
  });
});
