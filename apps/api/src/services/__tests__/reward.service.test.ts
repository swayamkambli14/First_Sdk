import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spinWheel } from '../reward.service.js';

// Mock dependencies that touch DB/Redis/blockchain
vi.mock('../../config/rules.loader.js', () => ({
  getSpinPool: (poolId: string) => {
    if (poolId === 'test_pool') {
      return [
        { reward_type: 'points', amount: 50, weight: 50 },
        { reward_type: 'points', amount: 200, weight: 30 },
        { reward_type: 'badge', badge_id: 'lucky', weight: 20 },
      ];
    }
    throw new Error('Pool not found');
  },
}));

vi.mock('../../config/env.js', () => ({
  env: { BLOCKCHAIN_MINTING_ENABLED: false },
}));

vi.mock('../../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

describe('spinWheel', () => {
  it('returns a result from the pool', () => {
    const result = spinWheel('test_pool');
    expect(['points', 'badge']).toContain(result.reward_type);
  });

  it('throws on unknown pool', () => {
    expect(() => spinWheel('nonexistent_pool')).toThrow();
  });

  it('returns a result with valid weight', () => {
    const result = spinWheel('test_pool');
    expect(result.weight).toBeGreaterThan(0);
  });

  it('distributes results across multiple spins (smoke test)', () => {
    const results = Array.from({ length: 100 }, () => spinWheel('test_pool'));
    const types = new Set(results.map((r) => r.reward_type));
    // With 100 spins, we should see both points and badge at least once
    expect(types.size).toBeGreaterThan(1);
  });
});
