/** Piece rects (integer edges), neighbors, adjacent pairs. */

/** A rectangle with integer pixel edges. */
export interface Rect {
  /** Left edge (pixels). */
  x: number;
  /** Top edge (pixels). */
  y: number;
  /** Width (pixels). */
  w: number;
  /** Height (pixels). */
  h: number;
}

/**
 * Compute the edge positions for N divisions across a span of `size` pixels.
 * `edges[i] = Math.round(i * size / N)`. Returns an array of length N+1.
 * Consecutive rects share the same integer edge, so pieces tile with no gaps or overlaps.
 */
export function computeEdges(N: number, size: number): number[] {
  const edges: number[] = new Array(N + 1);
  for (let i = 0; i <= N; i++) {
    edges[i] = Math.round((i * size) / N);
  }
  return edges;
}

/**
 * Return the Rect for the piece at (row, col) in an N×N grid of `size`×`size` pixels.
 * Uses computeEdges so pieces tile exactly with integer boundaries.
 */
export function pieceRect(N: number, size: number, row: number, col: number): Rect {
  const xs = computeEdges(N, size);
  const ys = computeEdges(N, size);
  return {
    x: xs[col],
    y: ys[row],
    w: xs[col + 1] - xs[col],
    h: ys[row + 1] - ys[row],
  };
}

/**
 * Return the piece index (0-based, row-major) for (row, col) in an N×N grid.
 */
export function pieceIndex(N: number, row: number, col: number): number {
  return row * N + col;
}

/**
 * Return the (row, col) for a given piece index in an N×N grid.
 */
export function pieceCoord(N: number, index: number): { row: number; col: number } {
  return { row: Math.floor(index / N), col: index % N };
}

/**
 * Return the 2–4 neighbor indices (up, down, left, right) for piece `index` in an N×N grid.
 * Only valid neighbors (within bounds) are returned.
 */
export function neighbors(N: number, index: number): number[] {
  const { row, col } = pieceCoord(N, index);
  const result: number[] = [];
  if (row > 0) result.push(pieceIndex(N, row - 1, col));
  if (row < N - 1) result.push(pieceIndex(N, row + 1, col));
  if (col > 0) result.push(pieceIndex(N, row, col - 1));
  if (col < N - 1) result.push(pieceIndex(N, row, col + 1));
  return result;
}

/**
 * Return all horizontally or vertically adjacent piece-index pairs [a, b] (a < b)
 * in an N×N grid. Used for the reassembly map.
 */
export function adjacentPairs(N: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      const a = pieceIndex(N, row, col);
      // right neighbor
      if (col + 1 < N) {
        const b = pieceIndex(N, row, col + 1);
        pairs.push([a, b]);
      }
      // bottom neighbor
      if (row + 1 < N) {
        const b = pieceIndex(N, row + 1, col);
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}
