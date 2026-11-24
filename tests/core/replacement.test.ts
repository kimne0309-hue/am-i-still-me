/**
 * Property tests for src/core/replacement.ts
 * P1  - replacementOrder is a permutation; restoreOrder is its exact reversal
 * P4  - adjacent pieces share the same effect in < 20% of pairs (N in {4,6,8}, seeds 0..500)
 * P5  - reassembly map is a permutation; map and inverseMap are mutual inverses
 * P9  - restoreOrder reversal: last replaced piece is first restored
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mulberry32, range } from '../../src/core/rng';
import { adjacentPairs } from '../../src/core/grid';
import {
  replacementOrder,
  restoreOrder,
  assignEffects,
  buildReassemblyMap,
} from '../../src/core/replacement';

// --- helpers ---------------------------------------------------------------

const arbSeed = fc.integer({ min: -2147483648, max: 2147483647 });
const arbN = fc.integer({ min: 1, max: 10 });

// --- P1 --------------------------------------------------------------------

describe('P1 - replacementOrder is a permutation', () => {
  it('returns a permutation of [0..N^2-1] for any seed and N', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const order = replacementOrder(rng, N);
        const total = N * N;
        expect(order).toHaveLength(total);
        expect([...order].sort((a, b) => a - b)).toEqual(range(total));
      }),
    );
  });
});

describe('P1 - restoreOrder is the exact reversal of replacementOrder', () => {
  it('restore order equals reversed replacement order for any seed and N', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const order = replacementOrder(rng, N);
        const restore = restoreOrder(order);
        expect(restore).toEqual([...order].reverse());
      }),
    );
  });
});

// --- P4 --------------------------------------------------------------------

describe('P4 - effect assignment: adjacent pairs share the same effect < 20% of the time', () => {
  /**
   * Validates: Requirements 5.2
   * N must be in {4, 6, 8} - the only grid sizes the app supports (qa.md P4, R5.2).
   * No fast-check: deterministic sweep over all spec grid sizes and seeds 0..500.
   */
  it('P4: fewer than 20% of adjacent pairs share an effect (N in {4,6,8}, seeds 0..500)', () => {
    for (const n of [4, 6, 8]) {
      for (let seed = 0; seed <= 500; seed++) {
        const effects = assignEffects(mulberry32(seed), n);
        const pairs = adjacentPairs(n);
        const shared = pairs.filter(([a, b]) => effects[a] === effects[b]).length;
        expect(shared / pairs.length).toBeLessThan(0.2);
      }
    }
  });
});

// --- P5 --------------------------------------------------------------------

describe('P5 - reassembly map is a permutation and map/inverseMap are mutual inverses', () => {
  it('map and inverseMap are both permutations of [0..N^2-1]', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const { map, inverseMap } = buildReassemblyMap(rng, N);
        const total = N * N;
        expect([...map].sort((a, b) => a - b)).toEqual(range(total));
        expect([...inverseMap].sort((a, b) => a - b)).toEqual(range(total));
      }),
    );
  });

  it('inverseMap[map[slot]] === slot for every slot', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const { map, inverseMap } = buildReassemblyMap(rng, N);
        const total = N * N;
        for (let slot = 0; slot < total; slot++) {
          expect(inverseMap[map[slot]]).toBe(slot);
        }
      }),
    );
  });

  it('map[inverseMap[piece]] === piece for every piece', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const { map, inverseMap } = buildReassemblyMap(rng, N);
        const total = N * N;
        for (let piece = 0; piece < total; piece++) {
          expect(map[inverseMap[piece]]).toBe(piece);
        }
      }),
    );
  });
});

// --- P9 --------------------------------------------------------------------

describe('P9 - restore order reversal: last replaced is first restored', () => {
  it('restore[0] === order[N^2-1] and restore[N^2-1] === order[0]', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const order = replacementOrder(rng, N);
        const restore = restoreOrder(order);
        expect(restore[0]).toBe(order[order.length - 1]);
        expect(restore[restore.length - 1]).toBe(order[0]);
      }),
    );
  });
});

// --- Additional unit tests -------------------------------------------------

describe('buildReassemblyMap - produces at least some swaps for grids with adjacent pairs', () => {
  it('map is not fully identity for a range of seeds (N=4)', () => {
    let nonIdentityCount = 0;
    for (let seed = 0; seed < 20; seed++) {
      const rng = mulberry32(seed);
      const { map } = buildReassemblyMap(rng, 4);
      const isIdentity = map.every((v, i) => v === i);
      if (!isIdentity) nonIdentityCount++;
    }
    expect(nonIdentityCount).toBe(20);
  });
});

describe('assignEffects - returns correct length and valid effect indices', () => {
  it('returns N^2 entries all in [0, EFFECT_COUNT)', () => {
    fc.assert(
      fc.property(arbSeed, arbN, (seed, N) => {
        const rng = mulberry32(seed);
        const effects = assignEffects(rng, N);
        expect(effects).toHaveLength(N * N);
        for (const e of effects) {
          expect(e).toBeGreaterThanOrEqual(0);
          expect(e).toBeLessThan(5); // EFFECT_COUNT
        }
      }),
    );
  });
});

