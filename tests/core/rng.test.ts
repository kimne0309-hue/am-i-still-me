/**
 * Property-based tests for src/core/rng.ts
 * Validates: P2 (determinism, [0,1) range, shuffle permutation, range, makeRunSeed)
 * and R15 (same seed + N gives identical sequence).
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mulberry32, makeRunSeed, pick, shuffle, range } from '../../src/core/rng';

describe('mulberry32', () => {
  it('P2 — same seed produces identical sequence of 100 values', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng1 = mulberry32(seed);
        const rng2 = mulberry32(seed);
        for (let i = 0; i < 100; i++) {
          expect(rng1()).toBe(rng2());
        }
      }),
      { endOnFailure: true },
    );
  });

  it('P2b — every output is in [0, 1)', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: 1, max: 1000 }),
        (seed, n) => {
          const rng = mulberry32(seed);
          for (let i = 0; i < n; i++) {
            const v = rng();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
          }
        },
      ),
      { endOnFailure: true },
    );
  });
});

describe('shuffle', () => {
  it('P2c — shuffle returns a permutation and does not mutate the input', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        (seed, arr) => {
          const original = [...arr];
          const rng = mulberry32(seed);
          const result = shuffle(rng, arr);

          // Different reference
          expect(result).not.toBe(arr);
          // Same length
          expect(result).toHaveLength(arr.length);
          // Same elements (sorted comparison)
          expect([...result].sort((a, b) => a - b)).toEqual(
            [...arr].sort((a, b) => a - b),
          );
          // Input not mutated
          expect(arr).toEqual(original);
        },
      ),
      { endOnFailure: true },
    );
  });
});

describe('range', () => {
  it('P2d — range(n) produces [0, 1, ..., n-1]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (n) => {
        const r = range(n);
        expect(r).toHaveLength(n);
        for (let i = 0; i < n; i++) {
          expect(r[i]).toBe(i);
        }
      }),
      { endOnFailure: true },
    );
  });
});

describe('makeRunSeed', () => {
  it('P2e — different gridSizes produce different seeds for the same baseSeed', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (base, s1, s2) => {
          fc.pre(s1 !== s2);
          expect(makeRunSeed(base, s1)).not.toBe(makeRunSeed(base, s2));
        },
      ),
      { endOnFailure: true },
    );
  });

  it('returns an unsigned 32-bit integer', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 200 }), (base, size) => {
        const s = makeRunSeed(base, size);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(4294967295);
        expect(Number.isInteger(s)).toBe(true);
      }),
      { endOnFailure: true },
    );
  });
});

describe('pick', () => {
  it('always returns an element that exists in the array', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
        (seed, arr) => {
          const rng = mulberry32(seed);
          const result = pick(rng, arr);
          expect(arr).toContain(result);
        },
      ),
      { endOnFailure: true },
    );
  });

  it('throws on an empty array', () => {
    expect(() => pick(mulberry32(0), [])).toThrow(RangeError);
  });
});
