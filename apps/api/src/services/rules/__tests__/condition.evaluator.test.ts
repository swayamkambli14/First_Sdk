import { describe, it, expect } from 'vitest';
import { evaluateConditions } from '../condition.evaluator.js';
import type { EvalContext } from '../../../config/rules.types.js';

const ctx: EvalContext = {
  event_type: 'purchase',
  metadata: { amount: 75, currency: 'USD' },
  user: {
    wallet_address: '0xabc',
    current_tier: 'silver',
    current_points: 600,
    total_points_earned: 1200,
    lifetime_event_count: { purchase: 1 },
    event_count_in_window: 3,
    cumulative_metadata: { purchase: { amount: 75 } },
  },
};

describe('evaluateConditions', () => {
  it('matches a simple == check', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'event_type', op: '==', value: 'purchase' }] },
      ctx
    );
    expect(result).toBe(true);
  });

  it('fails a == check with wrong value', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'event_type', op: '==', value: 'referral' }] },
      ctx
    );
    expect(result).toBe(false);
  });

  it('matches >= on metadata.amount', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'metadata.amount', op: '>=', value: 50 }] },
      ctx
    );
    expect(result).toBe(true);
  });

  it('fails >= when value is too low', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'metadata.amount', op: '>=', value: 100 }] },
      ctx
    );
    expect(result).toBe(false);
  });

  it('AND logic: all must pass', () => {
    const result = evaluateConditions(
      {
        operator: 'AND',
        checks: [
          { field: 'metadata.amount', op: '>=', value: 50 },
          { field: 'user.current_tier', op: '==', value: 'gold' }, // fails
        ],
      },
      ctx
    );
    expect(result).toBe(false);
  });

  it('OR logic: any passing is enough', () => {
    const result = evaluateConditions(
      {
        operator: 'OR',
        checks: [
          { field: 'metadata.amount', op: '>=', value: 50 },  // passes
          { field: 'user.current_tier', op: '==', value: 'gold' }, // fails
        ],
      },
      ctx
    );
    expect(result).toBe(true);
  });

  it('handles "in" operator', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'user.current_tier', op: 'in', value: ['silver', 'gold'] }] },
      ctx
    );
    expect(result).toBe(true);
  });

  it('handles lifetime_event_count check', () => {
    const result = evaluateConditions(
      { operator: 'AND', checks: [{ field: 'user.lifetime_event_count.purchase', op: '==', value: 1 }] },
      ctx
    );
    expect(result).toBe(true);
  });
});
