/**
 * anim() / enter() / leave() WAAPI helpers incl. reduced-motion mapping.
 * Keyframe library for scene choreographies.
 */

import { speed } from './ticker.js';
import { cssEase, DUR, type EaseName } from './easings.js';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AnimOptions {
  /** Spring preset name used to pick easing string and default duration. Defaults to 'gentle'. */
  ease?: EaseName;
  /** Duration override in ms. When omitted, DUR[ease] is used. */
  dur?: number;
  /** Delay in ms. Skipped (0) in reduced-motion mode. */
  delay?: number;
  /** Fill mode. Defaults to 'none' for anim(), 'backwards' for enter(), 'forwards' for leave(). */
  fill?: FillMode;
  /** Number of iterations. Defaults to 1. */
  iterations?: number;
}

// ---------------------------------------------------------------------------
// Reduced-motion detection
// ---------------------------------------------------------------------------

/**
 * True when `prefers-reduced-motion: reduce` is active OR `?rm=1` is in the URL.
 * Re-evaluated on every call so a runtime media-query change is respected.
 */
export function prefersReducedMotion(): boolean {
  try {
    if (new URLSearchParams(location.search).get('rm') === '1') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a PropertyIndexedKeyframes object into a Keyframe array.
 * Each property's value array must have the same length.
 */
function propertyIndexedToKeyframes(pik: PropertyIndexedKeyframes): Keyframe[] {
  const entries = Object.entries(pik) as [string, (string | number | null)[]][];
  if (entries.length === 0) return [];
  const len = entries[0][1].length;
  return Array.from({ length: len }, (_, i) => {
    const kf: Keyframe = {};
    for (const [prop, vals] of entries) {
      const v = vals[i];
      if (v !== null && v !== undefined) {
        // `offset` is a Keyframe property, all others are CSS properties
        (kf as Record<string, string | number | null>)[prop] = v;
      }
    }
    if (kf.offset === undefined) {
      kf.offset = len === 1 ? 1 : i / (len - 1);
    }
    return kf;
  });
}

/**
 * Extract only the opacity keyframes from a Keyframe array.
 * Returns null when fewer than 2 opacity values exist.
 */
function extractOpacityKeyframes(keyframes: Keyframe[]): Keyframe[] | null {
  const withOpacity = keyframes.filter(kf => kf.opacity !== undefined);
  if (withOpacity.length < 2) return null;
  return withOpacity.map(kf => ({ opacity: kf.opacity, offset: kf.offset }));
}

// ---------------------------------------------------------------------------
// Core: anim()
// ---------------------------------------------------------------------------

/**
 * Animate an element with WAAPI.
 *
 * - `playbackRate` is set to the global `speed` multiplier.
 * - In reduced motion: runs only opacity keyframes at 200 ms, or resolves
 *   to null instantly when there are no opacity keyframes to animate.
 * - Cancellation-safe: a cancelled animation resolves the promise to null
 *   and never throws.
 */
export function anim(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  opts: AnimOptions = {},
): Promise<Animation | null> {
  const rm = prefersReducedMotion();
  const easeName: EaseName = opts.ease ?? 'gentle';
  const baseDur = opts.dur ?? DUR[easeName];
  const delay = opts.delay ?? 0;
  const fill: FillMode = opts.fill ?? 'none';

  // Normalise to Keyframe[]
  const normalFrames: Keyframe[] = Array.isArray(keyframes)
    ? keyframes
    : propertyIndexedToKeyframes(keyframes);

  let frames: Keyframe[];
  let dur: number;

  if (rm) {
    // Reduced motion: use opacity-only fade at 200 ms, or finish instantly
    const opacityFrames = extractOpacityKeyframes(normalFrames);
    if (!opacityFrames) {
      return Promise.resolve(null);
    }
    frames = opacityFrames;
    dur = 200;
  } else {
    frames = normalFrames;
    dur = baseDur;
  }

  const animation = el.animate(frames, {
    duration: dur,
    delay: rm ? 0 : delay,
    easing: rm ? 'ease' : cssEase(easeName),
    fill,
    iterations: opts.iterations ?? 1,
  });
  animation.playbackRate = speed;

  return animation.finished.then(
    a => a,
    () => null, // cancellation (or any rejection) resolves to null — never throws
  );
}

// ---------------------------------------------------------------------------
// enter() / leave()
// ---------------------------------------------------------------------------

/**
 * Enter animation: same as `anim()` but `fill` defaults to `'backwards'`,
 * so the element stays hidden during its delay.
 */
export function enter(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  opts: AnimOptions = {},
): Promise<Animation | null> {
  return anim(el, keyframes, { fill: 'backwards', ...opts });
}

/**
 * Leave animation: same as `anim()` but `fill` defaults to `'forwards'`,
 * so the element stays in its final state after the animation ends.
 */
export function leave(
  el: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  opts: AnimOptions = {},
): Promise<Animation | null> {
  return anim(el, keyframes, { fill: 'forwards', ...opts });
}

// ---------------------------------------------------------------------------
// cancelSubtree()
// ---------------------------------------------------------------------------

/**
 * Cancel all WAAPI animations on `el` and every descendant.
 * Call this when hiding a scene to avoid stale `fill: 'both'` animations.
 */
export function cancelSubtree(el: Element): void {
  el.getAnimations({ subtree: true }).forEach(a => a.cancel());
}

// ---------------------------------------------------------------------------
// wait()
// ---------------------------------------------------------------------------

/**
 * Speed-aware `setTimeout` wrapper.
 * Waits `ms / speed` milliseconds.
 * In reduced-motion mode the wait is capped at 220 ms.
 */
export function wait(ms: number): Promise<void> {
  const rm = prefersReducedMotion();
  const effective = rm ? Math.min(ms / speed, 220) : ms / speed;
  return new Promise(resolve => setTimeout(resolve, effective));
}

// ---------------------------------------------------------------------------
// Keyframe library
// ---------------------------------------------------------------------------

/** Fade up: element enters from y+16 px, opacity 0→1, scale .96→1. */
export const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(16px) scale(.96)', offset: 0 },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 },
];

/** Pop in: element enters from scale .4, opacity 0→1. */
export const popIn: Keyframe[] = [
  { opacity: 0, transform: 'scale(.4)', offset: 0 },
  { opacity: 1, transform: 'scale(1)', offset: 1 },
];

/** Drop in: element enters from translateY(-.7em) scale(.6) — for letter drops. */
export const dropIn: Keyframe[] = [
  { opacity: 0, transform: 'translateY(-.7em) scale(.6)', offset: 0 },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 },
];

/** Card in: element enters from translateY(20 px), opacity 0→1 — for staggered cards. */
export const cardIn: Keyframe[] = [
  { opacity: 0, transform: 'translateY(20px)', offset: 0 },
  { opacity: 1, transform: 'translateY(0)', offset: 1 },
];

/** Out down: element exits to y+16 px, opacity 0, scale .96. */
export const outDown: Keyframe[] = [
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0 },
  { opacity: 0, transform: 'translateY(16px) scale(.96)', offset: 1 },
];

/** Out shrink: element exits by scaling to .4, opacity 0. */
export const outShrink: Keyframe[] = [
  { opacity: 1, transform: 'scale(1)', offset: 0 },
  { opacity: 0, transform: 'scale(.4)', offset: 1 },
];

/** Fade in: simple opacity 0→1. */
export const fadeIn: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 1, offset: 1 },
];

/** Fade out: simple opacity 1→0. */
export const fadeOut: Keyframe[] = [
  { opacity: 1, offset: 0 },
  { opacity: 0, offset: 1 },
];
