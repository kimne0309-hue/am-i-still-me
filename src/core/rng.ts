/** mulberry32 seeded PRNG, plus pick / shuffle / range helpers. */

/**
 * Mulberry32 PRNG. Returns a function that produces floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function (): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Per-run seed: XOR the base seed with imul(gridSize, 2654435761), unsigned right-shifted by 0.
 * Used so each grid size gets its own independent sequence.
 */
export function makeRunSeed(baseSeed: number, gridSize: number): number {
  return (baseSeed ^ Math.imul(gridSize, 2654435761)) >>> 0;
}

/**
 * Pick a random element from an array. Never mutates the array.
 * Throws if the array is empty.
 */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new RangeError('pick: array must not be empty');
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Fisher-Yates shuffle. Returns a NEW array — never mutates the input.
 */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns an array [0, 1, 2, ..., n-1].
 */
export function range(n: number): number[] {
  const r: number[] = new Array(n);
  for (let i = 0; i < n; i++) r[i] = i;
  return r;
}
