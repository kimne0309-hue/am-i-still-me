/**
 * Spring + Prop (spring | tween) — pure math, testable.
 * No DOM access, no rAF, no side effects.
 */

/** Parameters for a spring (mass = 1). */
export interface SpringParams {
  k: number;
  c: number;
}

/** Named spring presets. All use mass = 1. */
export const PRESETS = {
  snappy: { k: 420, c: 27 },
  pop:    { k: 256, c: 16 },
  jelly:  { k: 380, c: 11 },
  gentle: { k:  70, c: 13 },
  follow: { k: 140, c: 24 },
} as const;

export type PresetName = keyof typeof PRESETS;

/**
 * Semi-implicit Euler spring with fixed 1/240 s substeps.
 * Frame dt is clamped to 0.1 s to prevent spiral-of-death after tab switches.
 */
export class Spring {
  /** Current position. */
  x: number;
  /** Current velocity. */
  v: number = 0;
  /** Current target position. */
  target: number;
  /** True when the spring has settled on its target. */
  done: boolean = true;

  private k: number;
  private c: number;
  /** Max displacement used for the rest-condition thresholds. */
  private travel: number = 1;
  /** Accumulated time not yet consumed by substeps. */
  private _acc: number = 0;

  constructor(initial: number, preset: SpringParams = PRESETS.gentle) {
    this.x = initial;
    this.target = initial;
    this.k = preset.k;
    this.c = preset.c;
  }

  /**
   * Set a new target. Optionally change the preset and add an initial velocity.
   * Always marks the spring as active (done = false).
   */
  to(target: number, preset?: SpringParams, vel: number = 0): void {
    if (preset) {
      this.k = preset.k;
      this.c = preset.c;
    }
    this.travel = Math.max(
      Math.abs(target - this.x),
      Math.abs(vel) / Math.sqrt(this.k),
      1e-6,
    );
    this.target = target;
    this.v += vel;
    this.done = false;
  }

  /**
   * Add a velocity impulse without changing the target.
   * Optionally change the preset.
   */
  kick(vel: number, preset?: SpringParams): void {
    if (preset) {
      this.k = preset.k;
      this.c = preset.c;
    }
    // Recompute travel to account for the new velocity component.
    this.travel = Math.max(
      Math.abs(this.target - this.x),
      Math.abs(this.v + vel) / Math.sqrt(this.k),
      1e-6,
    );
    this.v += vel;
    this.done = false;
  }

  /**
   * Snap immediately to value. Resets velocity and marks done.
   * Used in reduced-motion mode.
   */
  set(value: number): void {
    this.x = value;
    this.target = value;
    this.v = 0;
    this._acc = 0;
    this.done = true;
  }

  /**
   * Advance the spring by dt seconds.
   * Returns true when the spring is at rest on its target.
   */
  step(dt: number): boolean {
    if (this.done) return true;

    this._acc += Math.min(dt, 0.1);
    const h = 1 / 240;

    while (this._acc >= h) {
      const a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
      this._acc -= h;
    }

    // Rest condition with absolute floors (Appendix A — required for tiny travels).
    const dx = Math.abs(this.x - this.target);
    const restX = Math.max(0.0005 * this.travel, 0.001);
    const restV = Math.max(0.005 * this.travel, 0.01);

    if (dx < restX && Math.abs(this.v) < restV) {
      this.x = this.target;
      this.v = 0;
      this._acc = 0;
      this.done = true;
    }

    return this.done;
  }
}

// ---------------------------------------------------------------------------
// Tween helpers
// ---------------------------------------------------------------------------

function easeInQuad(t: number): number  { return t * t; }
function easeOutQuad(t: number): number { return t * (2 - t); }
function linearEase(t: number): number  { return t; }

/** Specification for a simple time-based tween. */
export interface TweenSpec {
  from: number;
  to:   number;
  /** Duration in seconds. */
  dur:  number;
  ease: 'easeInQuad' | 'easeOutQuad' | 'linear';
}

const EASE_FNS: Record<TweenSpec['ease'], (t: number) => number> = {
  easeInQuad:  easeInQuad,
  easeOutQuad: easeOutQuad,
  linear:      linearEase,
};

/**
 * A Prop wraps a Spring plus an optional tween overlay.
 * While the tween is active, `value` returns the tween value.
 * Both must be done for `done` to return true.
 */
export class Prop {
  readonly spring: Spring;
  private tween: TweenSpec | null = null;
  private tweenT: number = 0;

  constructor(initial: number, preset?: SpringParams) {
    this.spring = new Spring(initial, preset ?? PRESETS.gentle);
  }

  /** Delegate to spring.to(). */
  to(target: number, preset?: SpringParams, vel?: number): void {
    this.spring.to(target, preset, vel);
  }

  /** Delegate to spring.kick(). */
  kick(vel: number, preset?: SpringParams): void {
    this.spring.kick(vel, preset);
  }

  /** Delegate to spring.set(). */
  set(value: number): void {
    this.spring.set(value);
    this.tween = null;
    this.tweenT = 0;
  }

  /** Start a tween; overrides spring value during the tween duration. */
  startTween(spec: TweenSpec): void {
    this.tween = spec;
    this.tweenT = 0;
  }

  /**
   * Advance by dt seconds.
   * Returns true when both the spring and any active tween are done.
   */
  step(dt: number): boolean {
    const springDone = this.spring.step(dt);

    let tweenDone = true;
    if (this.tween !== null) {
      this.tweenT += dt;
      if (this.tweenT >= this.tween.dur) {
        this.tweenT = this.tween.dur;
        this.tween = null;
      } else {
        tweenDone = false;
      }
    }

    return springDone && tweenDone;
  }

  /** Current value: tween output while active, otherwise spring.x. */
  get value(): number {
    if (this.tween !== null) {
      const t = this.tween.dur > 0 ? this.tweenT / this.tween.dur : 1;
      const easedT = EASE_FNS[this.tween.ease](Math.min(t, 1));
      return this.tween.from + (this.tween.to - this.tween.from) * easedT;
    }
    return this.spring.x;
  }

  /** True when both the spring is done and no tween is running. */
  get done(): boolean {
    return this.spring.done && this.tween === null;
  }
}
