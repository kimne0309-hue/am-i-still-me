/** Replacement order, effect assignment, reassembly map, restore order. */

import { shuffle, range } from './rng';
import { adjacentPairs } from './grid';

/** The number of distinct ghost effect types. */
export const EFFECT_COUNT = 5;

/**
 * Generate the replacement order: a shuffled permutation of [0, N²-1].
 * This is the order in which pieces are replaced during the ritual.
 */
export function replacementOrder(rng: () => number, N: number): number[] {
  return shuffle(rng, range(N * N));
}

/**
 * Generate the restore order: the reversal of the replacement order.
 * Pieces are restored in reverse replacement order (last replaced → first restored).
 */
export function restoreOrder(order: number[]): number[] {
  return order.slice().reverse();
}

/**
 * Assign a ghost effect index (0–4) to each piece in raster order (N×N pieces).
 * Adjacent pieces (left/top neighbor) are nudged to have different effects (re-pick up to 3×).
 * Returns an array of length N² where effectByPiece[pieceIndex] = effectIndex.
 */
export function assignEffects(rng: () => number, N: number): number[] {
  const effects: number[] = new Array(N * N);
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const idx = row * N + col;
      let effect = Math.floor(rng() * EFFECT_COUNT);
      for (let attempt = 0; attempt < 3; attempt++) {
        const leftEffect = col > 0 ? effects[idx - 1] : -1;
        const topEffect = row > 0 ? effects[idx - N] : -1;
        if (effect !== leftEffect && effect !== topEffect) break;
        effect = Math.floor(rng() * EFFECT_COUNT);
      }
      effects[idx] = effect;
    }
  }
  return effects;
}

/**
 * Build the reassembly map and its inverse.
 * map[slot] = piece  (which piece occupies each slot in the reassembled portrait)
 * inverseMap[piece] = slot  (where each piece lands)
 *
 * Starts as identity, then swaps up to ceil(max(2, round(0.15*N²)) / 2) adjacent slot pairs.
 */
export function buildReassemblyMap(
  rng: () => number,
  N: number,
): { map: number[]; inverseMap: number[] } {
  const total = N * N;
  const map = range(total); // identity: map[slot] = slot (= piece)
  const k = Math.max(2, Math.round(0.15 * total));
  const pairsNeeded = Math.ceil(k / 2);

  // Shuffle all adjacent pairs to get a random order
  const allPairs = adjacentPairs(N);
  const shuffledPairs = shuffle(rng, allPairs);

  const used = new Set<number>();
  let swapped = 0;

  for (const [a, b] of shuffledPairs) {
    if (swapped >= pairsNeeded) break;
    if (!used.has(a) && !used.has(b)) {
      // Swap
      [map[a], map[b]] = [map[b], map[a]];
      used.add(a);
      used.add(b);
      swapped++;
    }
  }

  // Build inverse: inverseMap[piece] = slot
  const inverseMap = range(total);
  for (let slot = 0; slot < total; slot++) {
    inverseMap[map[slot]] = slot;
  }

  return { map, inverseMap };
}
