/**
 * CSS easing strings, durations, and linear() support detection.
 * Re-exports PRESETS from spring.ts for convenience.
 */

import { PRESETS as SPRING_PRESETS } from './spring.js';

export { SPRING_PRESETS as PRESETS };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Spring preset names usable as ease keys. */
export type EaseName = 'snappy' | 'pop' | 'jelly' | 'gentle' | 'follow' | 'in' | 'out' | 'inOut';

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

/**
 * CSS duration in ms for each ease name.
 * Spring-derived values come from the motion.md preset table.
 * 'follow', 'in', 'out', 'inOut' use fixed durations.
 */
export const DUR: Record<EaseName, number> = {
  snappy: 321,
  pop:    558,
  jelly:  883,
  gentle: 850,
  follow: 400,
  in:     300,
  out:    300,
  inOut:  400,
};

// ---------------------------------------------------------------------------
// Easing strings
// ---------------------------------------------------------------------------

/** CSS linear() strings generated from the spring presets (29 samples). */
const LINEAR_STRINGS: Record<EaseName, string> = {
  snappy: 'linear(0, 0.04, 0.124, 0.196, 0.314, 0.437, 0.556, 0.63, 0.73, 0.816, 0.887, 0.926, 0.972, 1.007, 1.03, 1.041, 1.051, 1.055, 1.054, 1.052, 1.047, 1.041, 1.035, 1.03, 1.024, 1.018, 1.013, 1.01, 1)',
  pop:    'linear(0, 0.06, 0.194, 0.33, 0.512, 0.689, 0.844, 0.946, 1.044, 1.11, 1.145, 1.156, 1.152, 1.134, 1.109, 1.081, 1.053, 1.033, 1.011, 0.995, 0.984, 0.979, 0.976, 0.976, 0.978, 0.982, 0.986, 0.99, 1)',
  jelly:  'linear(0, 0.206, 0.567, 0.995, 1.264, 1.39, 1.355, 1.211, 1.038, 0.919, 0.852, 0.853, 0.902, 0.961, 1.021, 1.055, 1.06, 1.044, 1.022, 0.997, 0.982, 0.976, 0.981, 0.989, 0.999, 1.006, 1.009, 1.009, 1)',
  gentle: 'linear(0, 0.03, 0.112, 0.207, 0.311, 0.416, 0.531, 0.622, 0.703, 0.782, 0.839, 0.886, 0.923, 0.956, 0.977, 0.993, 1.005, 1.012, 1.016, 1.018, 1.018, 1.017, 1.016, 1.014, 1.012, 1.01, 1.008, 1.006, 1)',
  // follow, in, out, inOut have no linear() variant — use cubic-bezier always
  follow: 'cubic-bezier(.65,0,.35,1)',
  in:     'cubic-bezier(.55,0,.75,.2)',
  out:    'cubic-bezier(.16,.84,.3,1)',
  inOut:  'cubic-bezier(.65,0,.35,1)',
};

/** Cubic-bezier fallbacks for spring-based eases (and always for utility eases). */
const CUBIC_STRINGS: Record<EaseName, string> = {
  snappy: 'cubic-bezier(.3,1.3,.5,1)',
  pop:    'cubic-bezier(.34,1.56,.64,1)',
  jelly:  'cubic-bezier(.4,2,.4,.75)',
  gentle: 'cubic-bezier(.22,.8,.3,1)',
  follow: 'cubic-bezier(.65,0,.35,1)',
  in:     'cubic-bezier(.55,0,.75,.2)',
  out:    'cubic-bezier(.16,.84,.3,1)',
  inOut:  'cubic-bezier(.65,0,.35,1)',
};

// ---------------------------------------------------------------------------
// linear() detection
// ---------------------------------------------------------------------------

/** Detect browser support for CSS linear() easing via a one-time try/catch. */
function detectLinear(): boolean {
  try {
    const el = document.createElement('div');
    el.animate({}, { duration: 1, easing: 'linear(0, 1)' });
    return true;
  } catch {
    return false;
  }
}

/**
 * True if the browser supports CSS linear() easing.
 * Detected once at module load; returns false in test/non-DOM environments.
 */
export const supportsLinear: boolean = (() => {
  try {
    return detectLinear();
  } catch {
    return false;
  }
})();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the CSS easing string for the given ease name.
 * Uses linear() if supported (spring-derived eases only), otherwise the
 * cubic-bezier fallback. Utility eases ('follow', 'in', 'out', 'inOut')
 * always return cubic-bezier.
 */
export function cssEase(name: EaseName): string {
  if (supportsLinear) {
    return LINEAR_STRINGS[name];
  }
  return CUBIC_STRINGS[name];
}
