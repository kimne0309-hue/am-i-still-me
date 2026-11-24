/** Auto-mode crescendo intervals for the ritual screen. */

/**
 * Returns the interval in seconds before the i-th auto replacement.
 * interval(i) = max(0.18, 1.2 * 0.92^i)
 */
export function autoInterval(i: number): number {
  return Math.max(0.18, 1.2 * Math.pow(0.92, i));
}

/**
 * Returns the delay in seconds before the FIRST auto replacement fires.
 * = 0.6 * interval(0)
 */
export function firstAutoDelay(): number {
  return 0.6 * autoInterval(0);
}

/**
 * Returns the total duration in seconds for all `count` auto replacements.
 * Uses the first-fire delay for the initial wait, then interval(i) for i = 1..count-1.
 * For count = 0, returns 0. For count = 1, returns firstAutoDelay().
 */
export function totalAutoDuration(count: number): number {
  if (count <= 0) return 0;
  let total = firstAutoDelay();
  for (let i = 1; i < count; i++) {
    total += autoInterval(i);
  }
  return total;
}
