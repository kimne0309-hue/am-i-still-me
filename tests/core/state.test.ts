/**
 * Tests for src/core/state.ts — FSM v2 + SessionData reducer.
 * P6: invalid events never throw, return same state.
 * P7: every non-landing state reaches landing via RESTART.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  transition,
  ALL_STATES,
  ALL_EVENTS,
  sessionReducer,
  initialSession,
  type SessionData,
} from '../../src/core/state';

// ── P6: Random event sequences — no throw, always a valid state ──────────────

describe('P6 — invalid events never throw, always return a valid state', () => {
  /**
   * Validates: Requirements 17.3–4 (P6)
   * For any (state, event) pair: transition never throws, and the result is
   * always a member of ALL_STATES.
   */
  it('property: transition(state, event) is total and returns a valid state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATES),
        fc.constantFrom(...ALL_EVENTS),
        (state, event) => {
          expect(() => transition(state, event)).not.toThrow();
          const next = transition(state, event);
          expect(ALL_STATES).toContain(next);
        },
      ),
      { endOnFailure: true },
    );
  });

  it('property: invalid events leave state unchanged', () => {
    // Enumerate (state, event) pairs that have no defined transition and are
    // not RESTART (which is universally valid from non-landing states).
    const validTransitions = new Set<string>([
      'landing:BEGIN',
      'offering:IMAGE_READY',
      'offering:IMAGE_ERROR',
      'offering:BACK',
      'framing:BACK',
      'framing:START',
      'preparing:PREPARED',
      'preparing:PREPARE_ERROR',
      'ritual:ALL_REPLACED',
      'question1:ANSWER1',
      'secondShip:ANSWER2',
      'verdict:RESTORE',
      'restoring:RESTORED',
    ]);

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATES),
        fc.constantFrom(...ALL_EVENTS),
        (state, event) => {
          const key = `${state}:${event}`;
          const isRestart = event === 'RESTART' && state !== 'landing';
          if (!validTransitions.has(key) && !isRestart) {
            expect(transition(state, event)).toBe(state);
          }
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ── P7: RESTART from every non-landing state → landing ──────────────────────

describe('P7 — every non-landing state reaches landing via RESTART', () => {
  /**
   * Validates: Requirements 17.3–4 (P7)
   */
  it('property: RESTART always goes to landing (non-landing states)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATES.filter((s) => s !== 'landing')),
        (state) => {
          expect(transition(state, 'RESTART')).toBe('landing');
        },
      ),
      { endOnFailure: true },
    );
  });

  it('RESTART from landing stays on landing', () => {
    expect(transition('landing', 'RESTART')).toBe('landing');
  });
});

// ── Unit tests for every valid transition row ────────────────────────────────

describe('valid transitions (unit)', () => {
  it('landing + BEGIN → offering', () => {
    expect(transition('landing', 'BEGIN')).toBe('offering');
  });

  it('offering + IMAGE_READY → framing', () => {
    expect(transition('offering', 'IMAGE_READY')).toBe('framing');
  });

  it('offering + IMAGE_ERROR → offering', () => {
    expect(transition('offering', 'IMAGE_ERROR')).toBe('offering');
  });

  it('offering + BACK → landing', () => {
    expect(transition('offering', 'BACK')).toBe('landing');
  });

  it('framing + BACK → offering', () => {
    expect(transition('framing', 'BACK')).toBe('offering');
  });

  it('framing + START → preparing', () => {
    expect(transition('framing', 'START')).toBe('preparing');
  });

  it('preparing + PREPARED → ritual', () => {
    expect(transition('preparing', 'PREPARED')).toBe('ritual');
  });

  it('preparing + PREPARE_ERROR → framing', () => {
    expect(transition('preparing', 'PREPARE_ERROR')).toBe('framing');
  });

  it('ritual + ALL_REPLACED → question1', () => {
    expect(transition('ritual', 'ALL_REPLACED')).toBe('question1');
  });

  it('question1 + ANSWER1 → secondShip', () => {
    expect(transition('question1', 'ANSWER1')).toBe('secondShip');
  });

  it('secondShip + ANSWER2 → verdict', () => {
    expect(transition('secondShip', 'ANSWER2')).toBe('verdict');
  });

  it('verdict + RESTORE → restoring', () => {
    expect(transition('verdict', 'RESTORE')).toBe('restoring');
  });

  it('restoring + RESTORED → restored', () => {
    expect(transition('restoring', 'RESTORED')).toBe('restored');
  });

  // A few representative invalid transitions
  it('landing + BACK stays on landing', () => {
    expect(transition('landing', 'BACK')).toBe('landing');
  });

  it('ritual + BEGIN stays on ritual', () => {
    expect(transition('ritual', 'BEGIN')).toBe('ritual');
  });

  it('verdict + ALL_REPLACED stays on verdict', () => {
    expect(transition('verdict', 'ALL_REPLACED')).toBe('verdict');
  });
});

// ── SessionData reducer tests ────────────────────────────────────────────────

describe('sessionReducer', () => {
  const initAction = {
    type: 'INIT' as const,
    seed: 42,
    gridSize: 6,
    replacementOrder: [0, 1, 2],
    effectByPiece: [0, 1, 2],
    map: [0, 1, 2],
    inverseMap: [0, 1, 2],
  };

  it('INIT sets all fields and resets replacedCount to 0', () => {
    const blank = initialSession();
    const result = sessionReducer(blank, initAction);

    expect(result.seed).toBe(42);
    expect(result.gridSize).toBe(6);
    expect(result.replacementOrder).toEqual([0, 1, 2]);
    expect(result.effectByPiece).toEqual([0, 1, 2]);
    expect(result.map).toEqual([0, 1, 2]);
    expect(result.inverseMap).toEqual([0, 1, 2]);
    expect(result.replacedCount).toBe(0);
    expect(result.answer1).toBeUndefined();
    expect(result.answer2).toBeUndefined();
  });

  it('PIECE_REPLACED increments replacedCount by 1', () => {
    const session = sessionReducer(initialSession(), initAction);
    const after1 = sessionReducer(session, { type: 'PIECE_REPLACED' });
    const after2 = sessionReducer(after1, { type: 'PIECE_REPLACED' });

    expect(after1.replacedCount).toBe(1);
    expect(after2.replacedCount).toBe(2);
  });

  it('PIECE_REPLACED does not mutate the input', () => {
    const session = sessionReducer(initialSession(), initAction);
    const before = session.replacedCount;
    sessionReducer(session, { type: 'PIECE_REPLACED' });
    expect(session.replacedCount).toBe(before);
  });

  it('SET_ANSWER1 sets answer1 correctly', () => {
    const session = sessionReducer(initialSession(), initAction);

    const withYes = sessionReducer(session, { type: 'SET_ANSWER1', answer: 'yes' });
    expect(withYes.answer1).toBe('yes');

    const withNo = sessionReducer(session, { type: 'SET_ANSWER1', answer: 'no' });
    expect(withNo.answer1).toBe('no');
  });

  it('SET_ANSWER2 sets answer2 correctly', () => {
    const session = sessionReducer(initialSession(), initAction);

    for (const answer of ['ghost', 'reassembled', 'neither', 'both'] as const) {
      const result = sessionReducer(session, { type: 'SET_ANSWER2', answer });
      expect(result.answer2).toBe(answer);
    }
  });

  it('reducer is pure: input session is not mutated by any action', () => {
    const session = sessionReducer(initialSession(), initAction);
    const snapshot: SessionData = { ...session };

    sessionReducer(session, { type: 'PIECE_REPLACED' });
    sessionReducer(session, { type: 'SET_ANSWER1', answer: 'yes' });
    sessionReducer(session, { type: 'SET_ANSWER2', answer: 'ghost' });

    expect(session.replacedCount).toBe(snapshot.replacedCount);
    expect(session.answer1).toBe(snapshot.answer1);
    expect(session.answer2).toBe(snapshot.answer2);
  });

  it('initialSession returns a blank record with valid shapes', () => {
    const s = initialSession();
    expect(s.seed).toBe(0);
    expect(s.gridSize).toBe(4);
    expect(s.replacementOrder).toEqual([]);
    expect(s.replacedCount).toBe(0);
    expect(s.answer1).toBeUndefined();
    expect(s.answer2).toBeUndefined();
  });
});
