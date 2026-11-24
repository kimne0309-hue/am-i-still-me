/**
 * Tests for src/core/endings.ts
 * Validates: P8 — All 8 endings exist; correct mapping; body 2–4 sentences; only 'nobody' isWound.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ENDINGS,
  LOG_POOL,
  getEnding,
  makeLogPicker,
  type Answer1,
  type Answer2,
} from '../../src/core/endings';
import { mulberry32 } from '../../src/core/rng';

// ---------------------------------------------------------------------------
// P8 — Exhaustive ending table checks
// ---------------------------------------------------------------------------

describe('P8 — endings table', () => {
  const a1s: Answer1[] = ['yes', 'no'];
  const a2s: Answer2[] = ['ghost', 'reassembled', 'neither', 'both'];

  it('ENDINGS has exactly 8 entries', () => {
    expect(ENDINGS).toHaveLength(8);
  });

  it('every (answer1, answer2) pair maps to exactly one defined ending', () => {
    for (const a1 of a1s) {
      for (const a2 of a2s) {
        const e = getEnding(a1, a2);
        expect(e).toBeDefined();
        expect(e.answer1).toBe(a1);
        expect(e.answer2).toBe(a2);
      }
    }
  });

  it('all ending ids are unique', () => {
    const ids = ENDINGS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ENDINGS.length);
  });

  it('every ending body has 2–4 sentences', () => {
    for (const e of ENDINGS) {
      const sentences = e.body
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      expect(sentences.length, `${e.id} body sentence count`).toBeGreaterThanOrEqual(2);
      expect(sentences.length, `${e.id} body sentence count`).toBeLessThanOrEqual(4);
    }
  });

  it('every ending title has ≤ 5 words', () => {
    for (const e of ENDINGS) {
      const words = e.title.trim().split(/\s+/);
      expect(words.length, `"${e.title}" word count`).toBeLessThanOrEqual(5);
    }
  });

  it('every ending body is ≤ 220 chars', () => {
    for (const e of ENDINGS) {
      expect(e.body.length, `${e.id} body length`).toBeLessThanOrEqual(220);
    }
  });

  it('only "nobody" has isWound = true', () => {
    const wound = ENDINGS.filter((e) => e.isWound);
    expect(wound).toHaveLength(1);
    expect(wound[0].id).toBe('nobody');
  });

  it('all non-wound endings have isWound = false', () => {
    for (const e of ENDINGS.filter((e) => e.id !== 'nobody')) {
      expect(e.isWound).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// P8 property — getEnding never throws for valid inputs
// ---------------------------------------------------------------------------

describe('P8 property — getEnding', () => {
  it('never throws for any valid (answer1, answer2) pair', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Answer1>('yes', 'no'),
        fc.constantFrom<Answer2>('ghost', 'reassembled', 'neither', 'both'),
        (a1, a2) => {
          expect(() => getEnding(a1, a2)).not.toThrow();
          const e = getEnding(a1, a2);
          expect(e.answer1).toBe(a1);
          expect(e.answer2).toBe(a2);
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ---------------------------------------------------------------------------
// Log picker
// ---------------------------------------------------------------------------

describe('makeLogPicker', () => {
  it('only returns strings from LOG_POOL', () => {
    const rng = mulberry32(1);
    const pick = makeLogPicker(rng);
    const pool = new Set(LOG_POOL);
    for (let i = 0; i < LOG_POOL.length * 4; i++) {
      expect(pool.has(pick())).toBe(true);
    }
  });

  it('returns every line before repeating (no repeat within first LOG_POOL.length calls)', () => {
    const rng = mulberry32(42);
    const pick = makeLogPicker(rng);
    const seen = new Set<string>();
    for (let i = 0; i < LOG_POOL.length; i++) {
      const line = pick();
      expect(seen.has(line)).toBe(false);
      seen.add(line);
    }
    expect(seen.size).toBe(LOG_POOL.length);
  });

  it('never starts the reshuffled deck with the same line it ended on', () => {
    // Run with many seeds to exercise the boundary swap.
    for (let seed = 0; seed < 200; seed++) {
      const rng = mulberry32(seed);
      const pick = makeLogPicker(rng);
      // Drain the first deck.
      let last = '';
      for (let i = 0; i < LOG_POOL.length; i++) {
        last = pick();
      }
      // First pick of the new deck must differ from the last of the old deck.
      const first = pick();
      expect(first).not.toBe(last);
    }
  });

  it('property: across reshuffles, consecutive boundary lines never match', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (seed) => {
        const rng = mulberry32(seed);
        const pick = makeLogPicker(rng);
        let prev = '';
        // Run for 3 full decks, checking every deck-boundary pair.
        const total = LOG_POOL.length * 3;
        for (let i = 0; i < total; i++) {
          const line = pick();
          if (i === LOG_POOL.length || i === LOG_POOL.length * 2) {
            // This is the first pick of a fresh deck — must differ from previous.
            expect(line).not.toBe(prev);
          }
          prev = line;
        }
      }),
      { endOnFailure: true },
    );
  });
});
