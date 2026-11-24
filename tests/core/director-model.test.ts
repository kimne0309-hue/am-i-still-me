/**
 * Property-based and unit tests for src/core/director-model.ts
 *
 * P13 — Director model properties
 *   Validates: Requirements R16.6, R17.1
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  navigate,
  exitDone,
  enterDone,
  isInteractive,
  makeDirector,
  type DirectorState,
  type Phase,
} from '../../src/core/director-model';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('makeDirector', () => {
  it('starts idle on the initial scene', () => {
    const s = makeDirector('landing');
    expect(s.phase).toBe('idle');
    expect(s.current).toBe('landing');
    expect(s.target).toBe('landing');
    expect(isInteractive(s)).toBe(true);
  });
});

describe('navigate', () => {
  it('idle → same target is a no-op', () => {
    const s = makeDirector('landing');
    const s2 = navigate(s, 'landing');
    expect(s2).toBe(s);
  });

  it('idle → different target starts exiting', () => {
    const s = makeDirector('landing');
    const s2 = navigate(s, 'offering');
    expect(s2.phase).toBe('exiting');
    expect(s2.target).toBe('offering');
    expect(s2.current).toBe('landing');
  });

  it('exiting → navigate updates target only', () => {
    let s = makeDirector('landing');
    s = navigate(s, 'offering');
    s = navigate(s, 'framing');
    expect(s.phase).toBe('exiting');
    expect(s.target).toBe('framing');
    expect(s.current).toBe('landing');
  });
});

describe('exitDone → enterDone happy path', () => {
  it('landing → offering completes correctly', () => {
    let s = makeDirector('landing');
    s = navigate(s, 'offering');
    expect(s.phase).toBe('exiting');
    s = exitDone(s);
    expect(s.phase).toBe('entering');
    s = enterDone(s);
    expect(s.phase).toBe('idle');
    expect(s.current).toBe('offering');
    expect(isInteractive(s)).toBe(true);
  });
});

describe('target changes mid-flight', () => {
  it('navigate during entering causes another exit after enterDone', () => {
    let s = makeDirector('landing');
    s = navigate(s, 'offering');
    s = exitDone(s);                   // entering: offering
    s = navigate(s, 'framing');        // change target mid-enter
    expect(s.phase).toBe('entering'); // still entering offering
    expect(s.target).toBe('framing');
    s = enterDone(s);                  // offering entered but target != offering
    expect(s.phase).toBe('exiting');  // must start exiting toward framing
    expect(s.current).toBe('offering');
    expect(s.target).toBe('framing');
  });
});

describe('exitDone / enterDone no-ops', () => {
  it('exitDone in idle is a no-op', () => {
    const s = makeDirector('landing');
    expect(exitDone(s)).toBe(s);
  });

  it('enterDone in idle is a no-op', () => {
    const s = makeDirector('landing');
    expect(enterDone(s)).toBe(s);
  });

  it('enterDone in exiting is a no-op', () => {
    let s = makeDirector('landing');
    s = navigate(s, 'offering');
    expect(enterDone(s)).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// P13 — Property: isInteractive iff idle on target
// ---------------------------------------------------------------------------

describe('P13 — isInteractive iff idle on target', () => {
  it('holds for all state combinations', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.constantFrom<Phase>('idle', 'exiting', 'entering'),
        (current, target, pending, phase) => {
          const s: DirectorState = { current, target, pending, phase };
          expect(isInteractive(s)).toBe(phase === 'idle' && current === target);
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ---------------------------------------------------------------------------
// P13 — Property: 1000 random op sequences
// ---------------------------------------------------------------------------

type NavOp      = { op: 'navigate'; to: string };
type ExitOp     = { op: 'exitDone' };
type EnterOp    = { op: 'enterDone' };
type DirectorOp = NavOp | ExitOp | EnterOp;

const scenes = ['landing', 'offering', 'framing', 'ritual', 'verdict'] as const;

function applyOp(s: DirectorState, op: DirectorOp): DirectorState {
  if (op.op === 'navigate') return navigate(s, op.to);
  if (op.op === 'exitDone') return exitDone(s);
  return enterDone(s);
}

describe('P13 — 1000 random op sequences: invariants always hold', () => {
  it('phase is always valid; isInteractive iff idle on target', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record<NavOp>({
              op: fc.constant('navigate'),
              to: fc.constantFrom(...scenes),
            }),
            fc.record<ExitOp>({ op: fc.constant('exitDone') }),
            fc.record<EnterOp>({ op: fc.constant('enterDone') }),
          ),
          { minLength: 1, maxLength: 100 },
        ),
        (ops) => {
          let s = makeDirector('landing');
          for (const op of ops) {
            s = applyOp(s, op);
            // Phase is always a valid value.
            expect(['idle', 'exiting', 'entering']).toContain(s.phase);
            // isInteractive iff idle on target.
            expect(isInteractive(s)).toBe(s.phase === 'idle' && s.current === s.target);
          }
        },
      ),
      { endOnFailure: true, numRuns: 1000 },
    );
  });

  it('P13 — always converges to the latest target after completing a full cycle', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...scenes),
        fc.constantFrom(...scenes),
        (from, to) => {
          let s = makeDirector(from);
          // Navigate and run the full cycle.
          s = navigate(s, to);
          // Drain until idle (simulate animations completing).
          let iterations = 0;
          while (s.phase !== 'idle' && iterations < 20) {
            if (s.phase === 'exiting')  s = exitDone(s);
            if (s.phase === 'entering') s = enterDone(s);
            iterations++;
          }
          expect(s.phase).toBe('idle');
          expect(s.current).toBe(to);
          expect(isInteractive(s)).toBe(true);
        },
      ),
      { endOnFailure: true },
    );
  });

  it('P13 — mid-flight target changes always land on the latest target', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...scenes), { minLength: 2, maxLength: 10 }),
        (destinations) => {
          let s = makeDirector('landing');
          // Issue all navigates before any animations complete.
          for (const dest of destinations) {
            s = navigate(s, dest);
          }
          const finalTarget = destinations[destinations.length - 1];
          // Drain until idle.
          let iterations = 0;
          while (s.phase !== 'idle' && iterations < 40) {
            if (s.phase === 'exiting')  s = exitDone(s);
            if (s.phase === 'entering') s = enterDone(s);
            iterations++;
          }
          expect(s.phase).toBe('idle');
          expect(s.current).toBe(finalTarget);
        },
      ),
      { endOnFailure: true },
    );
  });
});
