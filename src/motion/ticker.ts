/**
 * Single shared requestAnimationFrame loop.
 * Subscribers receive dt in seconds (clamped to 0.1 s, multiplied by speed).
 * Return false to auto-unsubscribe. The loop stops when no subscribers remain.
 */

/** A ticker subscriber. Return false to unsubscribe. */
export type TickFn = (dt: number) => boolean | void;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const subscribers = new Set<TickFn>();
let rafHandle = 0;
let prevTime = 0;

/** Current global speed multiplier. Default 1. */
export let speed = readSpeedParam();

// ---------------------------------------------------------------------------
// Speed param
// ---------------------------------------------------------------------------

/** Read the ?speed= query parameter at module init. Returns 1 on any error. */
function readSpeedParam(): number {
  try {
    const params = new URLSearchParams(location.search);
    const v = parseFloat(params.get('speed') ?? '1');
    return isFinite(v) && v > 0 ? v : 1;
  } catch {
    return 1;
  }
}

// ---------------------------------------------------------------------------
// rAF loop
// ---------------------------------------------------------------------------

function loop(now: number): void {
  if (prevTime === 0) prevTime = now;

  const raw = Math.min((now - prevTime) / 1000, 0.1);
  const dt = raw * speed;
  prevTime = now;

  // Iterate a snapshot so subscribers can add/remove during the frame.
  for (const fn of [...subscribers]) {
    const keep = fn(dt);
    if (keep === false) {
      subscribers.delete(fn);
    }
  }

  if (subscribers.size === 0) {
    rafHandle = 0;
    prevTime = 0;
    return;
  }

  rafHandle = requestAnimationFrame(loop);
}

function startLoop(): void {
  if (rafHandle !== 0) return;
  prevTime = 0;
  rafHandle = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subscribe a function to the per-frame tick.
 * Receives dt in seconds (clamped to 0.1 s, multiplied by speed).
 * Return false to unsubscribe automatically.
 * Starts the rAF loop if it was stopped.
 */
export function subscribe(fn: TickFn): void {
  subscribers.add(fn);
  startLoop();
}

/**
 * Unsubscribe a function from the tick loop.
 */
export function unsubscribe(fn: TickFn): void {
  subscribers.delete(fn);
  if (subscribers.size === 0 && rafHandle !== 0) {
    cancelAnimationFrame(rafHandle);
    rafHandle = 0;
    prevTime = 0;
  }
}

/**
 * Set the global speed multiplier.
 * Applied to dt: effective_dt = raw_dt × speed.
 */
export function setSpeed(s: number): void {
  speed = s;
}
