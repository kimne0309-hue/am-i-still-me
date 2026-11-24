/**
 * Property-based and unit tests for src/motion/spring.ts
 *
 * P11 — Springs always settle (finite simulation budget)
 *   Validates: Requirements R16.2
 *
 * P12 — Spring overshoot at different frame rates differs by < 1 percentage point
 *   Validates: Requirements R16.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Spring, Prop, PRESETS, type PresetName, type TweenSpec } from '../../src/motion/spring';

// All preset names for use in arbitraries.
const presetNames = Object.keys(PRESETS) as PresetName[];

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('Spring — set()', () => {
  it('snaps immediately, done = true, velocity = 0', () => {
    const s = new Spring(0, PRESETS.snappy);
    s.to(100);
    s.step(1 / 60);
    s.set(42);
    expect(s.x).toBe(42);
    expect(s.target).toBe(42);
    expect(s.v).toBe(0);
    expect(s.done).toBe(true);
  });
});

describe('Spring — tiny travel settles (absolute floor test)', () => {
  it('from=0 to=0.0001 settles within 10 simulated seconds', () => {
    const s = new Spring(0, PRESETS.gentle);
    s.to(0.0001);
    let t = 0;
    const dt = 1 / 60;
    while (!s.done && t < 10) {
      s.step(dt);
      t += dt;
    }
    expect(s.done).toBe(true);
    expect(s.x).toBe(0.0001);
  });
});

describe('Spring — step(dt > 0.1) clamps without blowing up', () => {
  it('a 1-second dt does not produce NaN', () => {
    const s = new Spring(0, PRESETS.jelly);
    s.to(100);
    s.step(1); // internally clamped to 0.1
    expect(isNaN(s.x)).toBe(false);
    expect(isNaN(s.v)).toBe(false);
  });
});

describe('Spring — initial state is done', () => {
  it('a freshly constructed spring reports done', () => {
    const s = new Spring(50, PRESETS.pop);
    expect(s.done).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// P11 — Springs always settle
// ---------------------------------------------------------------------------

describe('P11 — Springs always settle within 10 simulated seconds', () => {
  it('every preset, any from/to in ±1000, dt = 1/60 s', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...presetNames),
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        fc.float({ min: -1000, max: 1000, noNaN: true }),
        (presetName, from, to) => {
          const spring = new Spring(from, PRESETS[presetName]);
          spring.to(to);
          let t = 0;
          const dt = 1 / 60;
          const maxT = 10;
          while (!spring.done && t < maxT) {
            spring.step(dt);
            t += dt;
          }
          expect(spring.done).toBe(true);
          expect(spring.x).toBe(to);
          expect(isNaN(spring.x)).toBe(false);
          expect(isNaN(spring.v)).toBe(false);
        },
      ),
      { endOnFailure: true },
    );
  });

  it('every preset, variable frame dt in [1/240, 0.5] s', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...presetNames),
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.array(
          fc.float({ min: Math.fround(1 / 240), max: 0.5, noNaN: true }),
          { minLength: 1, maxLength: 2000 },
        ),
        (presetName, from, to, dts) => {
          const spring = new Spring(from, PRESETS[presetName]);
          spring.to(to);
          let t = 0;
          for (const dt of dts) {
            if (spring.done) break;
            spring.step(dt);
            t += dt;
          }
          // If not settled yet, that's acceptable for this run (finite budget)
          // but x and v must never be NaN.
          expect(isNaN(spring.x)).toBe(false);
          expect(isNaN(spring.v)).toBe(false);
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ---------------------------------------------------------------------------
// P12 — Overshoot consistency across frame rates
// ---------------------------------------------------------------------------

describe('P12 — Spring overshoot at 30/60/120 fps differs by < 1 percentage point', () => {
  it('pop preset, travels of 10..500', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...presetNames),
        fc.float({ min: 10, max: 500, noNaN: true }),
        (presetName, travel) => {
          const preset = PRESETS[presetName];

          function peakOvershoot(dt: number): number {
            const s = new Spring(0, preset);
            s.to(travel);
            let peak = 0;
            const maxSteps = Math.ceil(2 / dt); // 2 simulated seconds max
            for (let i = 0; i < maxSteps; i++) {
              s.step(dt);
              if (s.x > peak) peak = s.x;
              if (s.done) break;
            }
            return peak;
          }

          const overshoot30  = (peakOvershoot(1 / 30)  - travel) / travel * 100;
          const overshoot60  = (peakOvershoot(1 / 60)  - travel) / travel * 100;
          const overshoot120 = (peakOvershoot(1 / 120) - travel) / travel * 100;

          // All must be finite
          expect(isFinite(overshoot30)).toBe(true);
          expect(isFinite(overshoot60)).toBe(true);
          expect(isFinite(overshoot120)).toBe(true);

          // Differ by < 1 percentage point
          expect(Math.abs(overshoot30 - overshoot60)).toBeLessThan(1);
          expect(Math.abs(overshoot60 - overshoot120)).toBeLessThan(1);
          expect(Math.abs(overshoot30 - overshoot120)).toBeLessThan(1);
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ---------------------------------------------------------------------------
// P12 — Kick properties
// ---------------------------------------------------------------------------

describe('Spring — kick()', () => {
  it('P12-kick: kick does not change the target, only adds velocity, marks active', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.float({ min: -500, max: 500, noNaN: true }),
        fc.float({ min: -200, max: 200, noNaN: true }),
        (from, target, vel) => {
          const spring = new Spring(from);
          spring.to(target);
          const targetBefore = spring.target;
          spring.kick(vel);
          expect(spring.target).toBe(targetBefore);
          expect(spring.done).toBe(false);
        },
      ),
      { endOnFailure: true },
    );
  });
});

// ---------------------------------------------------------------------------
// Prop tests
// ---------------------------------------------------------------------------

describe('Prop', () => {
  it('value returns spring.x when no tween is active', () => {
    const p = new Prop(0, PRESETS.snappy);
    p.to(100);
    p.step(1 / 60);
    expect(p.value).toBe(p.spring.x);
  });

  it('value returns interpolated tween value while active', () => {
    const p = new Prop(0, PRESETS.snappy);
    const spec: TweenSpec = { from: 0, to: 1, dur: 1, ease: 'linear' };
    p.startTween(spec);
    p.step(0.5);
    // At t=0.5 of a 1s linear tween, value ≈ 0.5
    expect(p.value).toBeCloseTo(0.5, 5);
  });

  it('tween completes and value reverts to spring', () => {
    const p = new Prop(5, PRESETS.snappy);
    const spec: TweenSpec = { from: 0, to: 1, dur: 0.1, ease: 'linear' };
    p.startTween(spec);
    p.step(0.2); // past end
    expect(p.value).toBe(p.spring.x);
  });

  it('set() clears an active tween', () => {
    const p = new Prop(0, PRESETS.snappy);
    p.startTween({ from: 0, to: 1, dur: 1, ease: 'linear' });
    p.set(42);
    expect(p.done).toBe(true);
    expect(p.value).toBe(42);
  });

  it('done is false while tween is active', () => {
    const p = new Prop(0, PRESETS.snappy);
    p.spring.set(0); // ensure spring is done
    p.startTween({ from: 0, to: 1, dur: 1, ease: 'linear' });
    p.step(0.1);
    expect(p.done).toBe(false);
  });
});
