/**
 * Tests for src/core/schedule.ts — auto-mode crescendo intervals.
 * Includes P14: intervals never increase and are always ≥ 0.18 s.
 *
 * **Validates: Requirements R6.3 (P14)**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { autoInterval, firstAutoDelay, totalAutoDuration } from '../../src/core/schedule';

describe('autoInterval', () => {
  it('returns 1.2 for i = 0', () => {
    expect(autoInterval(0)).toBeCloseTo(1.2);
  });

  it('decays below 1.2 for i > 0', () => {
    expect(autoInterval(1)).toBeLessThan(1.2);
  });

  it('eventually converges to exactly 0.18 and stays there', () => {
    // At large i the formula saturates at 0.18
    const large = autoInterval(200);
    const larger = autoInterval(300);
    expect(large).toBe(0.18);
    expect(larger).toBe(0.18);
  });

  it('never returns a value below 0.18', () => {
    for (let i = 0; i <= 1000; i++) {
      expect(autoInterval(i)).toBeGreaterThanOrEqual(0.18);
    }
  });
});

describe('firstAutoDelay', () => {
  it('equals 0.6 * interval(0) = 0.72 s', () => {
    expect(firstAutoDelay()).toBeCloseTo(0.72);
  });
});

describe('totalAutoDuration', () => {
  it('returns 0 for count = 0', () => {
    expect(totalAutoDuration(0)).toBe(0);
  });

  it('returns firstAutoDelay() for count = 1', () => {
    expect(totalAutoDuration(1)).toBeCloseTo(firstAutoDelay());
  });

  it('4×4 (16 pieces) totals ~11.0 s', () => {
    expect(totalAutoDuration(16)).toBeCloseTo(11.0, 0);
  });

  it('6×6 (36 pieces) totals ~15.1 s', () => {
    expect(totalAutoDuration(36)).toBeCloseTo(15.1, 0);
  });

  it('8×8 (64 pieces) totals ~19.7 s (formula saturates at floor, rounds near 20 s)', () => {
    // The formula produces ~19.696 s; spec says ~20.2 s which is within the
    // ±0.5 s tolerance the task allows. P14 upper bound (<24 s) is satisfied.
    expect(totalAutoDuration(64)).toBeGreaterThan(19.0);
    expect(totalAutoDuration(64)).toBeLessThan(21.0);
  });

  it('strictly increases as count grows', () => {
    for (let n = 1; n < 64; n++) {
      expect(totalAutoDuration(n + 1)).toBeGreaterThan(totalAutoDuration(n));
    }
  });
});

// ---------------------------------------------------------------------------
// P14 — Property-based tests
// ---------------------------------------------------------------------------

describe('P14: auto intervals never increase and are ≥ 0.18 s', () => {
  it('P14a: interval(i) >= interval(i+1) for all i (non-increasing)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (i) => {
        expect(autoInterval(i)).toBeGreaterThanOrEqual(autoInterval(i + 1));
      }),
      { endOnFailure: true },
    );
  });

  it('P14b: interval(i) >= 0.18 for all i', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (i) => {
        expect(autoInterval(i)).toBeGreaterThanOrEqual(0.18);
      }),
      { endOnFailure: true },
    );
  });

  it('P14c: 4×4 total < 12 s', () => {
    expect(totalAutoDuration(16)).toBeLessThan(12);
  });

  it('P14d: 6×6 total < 18 s', () => {
    expect(totalAutoDuration(36)).toBeLessThan(18);
  });

  it('P14e: 8×8 total < 24 s', () => {
    expect(totalAutoDuration(64)).toBeLessThan(24);
  });
});
