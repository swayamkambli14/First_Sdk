import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateFormula } from '../formula.evaluator.js';
import type { EvalContext } from '../../../config/rules.types.js';

// Mock env and logger to avoid loading real config in unit tests
vi.mock('../../../config/env.js', () => ({
  env: { FORMULA_MAX_POINTS: 10000 },
}));
vi.mock('../../../utils/logger.js', () => ({
  default: { warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const baseContext: EvalContext = {
  event_type: 'purchase',
  metadata: { amount: 100 },
  user: {
    wallet_address: '0xabc',
    current_tier: 'silver',
    current_points: 500,
    total_points_earned: 1000,
    lifetime_event_count: { purchase: 3 },
    event_count_in_window: 5,
    cumulative_metadata: { purchase: { amount: 300 } },
  },
};

describe('evaluateFormula', () => {
  it('evaluates a simple multiplication formula', () => {
    const result = evaluateFormula('metadata.amount * 3', baseContext);
    expect(result).toBe(300);
  });

  it('evaluates a formula referencing user fields', () => {
    const result = evaluateFormula('user.current_points * 2', baseContext);
    expect(result).toBe(1000);
  });

  it('returns 0 and logs on invalid formula', () => {
    const result = evaluateFormula('metadata.amount * @@invalid', baseContext);
    expect(result).toBe(0);
  });

  it('caps result at FORMULA_MAX_POINTS', () => {
    const result = evaluateFormula('metadata.amount * 200', baseContext);
    expect(result).toBe(10000);
  });

  it('returns 0 for NaN result', () => {
    const result = evaluateFormula('metadata.nonexistent * 5', baseContext);
    expect(result).toBe(0);
  });

  it('floors decimal results', () => {
    const result = evaluateFormula('metadata.amount * 1.7', baseContext);
    expect(result).toBe(170);
  });
});
