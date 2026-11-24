/**
 * Tests for src/core/grid.ts
 * Includes property tests P3a–P3e (QA spec §P3).
 *
 * Validates: Requirements P3 — For size ∈ [64, 2048], grid rects tile the square
 * exactly: area sum = size², shared edges, all sizes > 0.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeEdges,
  pieceRect,
  pieceIndex,
  pieceCoord,
  neighbors,
  adjacentPairs,
} from '../../src/core/grid';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('computeEdges', () => {
  it('returns N+1 values', () => {
    expect(computeEdges(4, 400)).toHaveLength(5);
    expect(computeEdges(8, 1024)).toHaveLength(9);
  });

  it('starts at 0 and ends at size', () => {
    expect(computeEdges(6, 600)[0]).toBe(0);
    expect(computeEdges(6, 600)[6]).toBe(600);
  });

  it('is monotonically non-decreasing', () => {
    const edges = computeEdges(8, 1000);
    for (let i = 1; i <= 8; i++) {
      expect(edges[i]).toBeGreaterThanOrEqual(edges[i - 1]);
    }
  });

  it('handles N=1 (single piece)', () => {
    expect(computeEdges(1, 512)).toEqual([0, 512]);
  });
});

describe('pieceRect', () => {
  it('top-left piece starts at (0,0)', () => {
    const r = pieceRect(4, 400, 0, 0);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });

  it('pieces have positive width and height', () => {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const r = pieceRect(4, 400, row, col);
        expect(r.w).toBeGreaterThan(0);
        expect(r.h).toBeGreaterThan(0);
      }
    }
  });

  it('bottom-right piece ends at (size, size)', () => {
    const N = 6, size = 600;
    const r = pieceRect(N, size, N - 1, N - 1);
    expect(r.x + r.w).toBe(size);
    expect(r.y + r.h).toBe(size);
  });
});

describe('pieceIndex / pieceCoord', () => {
  it('index 0 is (0,0) for any N', () => {
    expect(pieceCoord(4, 0)).toEqual({ row: 0, col: 0 });
    expect(pieceCoord(8, 0)).toEqual({ row: 0, col: 0 });
  });

  it('last index is (N-1, N-1)', () => {
    const N = 6;
    expect(pieceCoord(N, N * N - 1)).toEqual({ row: N - 1, col: N - 1 });
  });

  it('round-trips for concrete values', () => {
    expect(pieceIndex(4, 1, 2)).toBe(6);
    expect(pieceCoord(4, 6)).toEqual({ row: 1, col: 2 });
  });
});

describe('neighbors', () => {
  it('corner piece has 2 neighbors', () => {
    expect(neighbors(4, 0)).toHaveLength(2);
    expect(neighbors(4, 15)).toHaveLength(2);
  });

  it('edge piece (non-corner) has 3 neighbors', () => {
    expect(neighbors(4, 1)).toHaveLength(3); // top edge, not corner
    expect(neighbors(4, 4)).toHaveLength(3); // left edge, not corner
  });

  it('interior piece has 4 neighbors', () => {
    expect(neighbors(4, 5)).toHaveLength(4);
    expect(neighbors(4, 6)).toHaveLength(4);
  });

  it('neighbor indices are within [0, N²-1]', () => {
    const N = 4;
    for (let i = 0; i < N * N; i++) {
      for (const nb of neighbors(N, i)) {
        expect(nb).toBeGreaterThanOrEqual(0);
        expect(nb).toBeLessThan(N * N);
      }
    }
  });
});

describe('adjacentPairs', () => {
  it('N=1 → no pairs', () => {
    expect(adjacentPairs(1)).toHaveLength(0);
  });

  it('N=2 → 4 pairs', () => {
    expect(adjacentPairs(2)).toHaveLength(4);
  });

  it('all pairs have a < b', () => {
    for (const [a, b] of adjacentPairs(5)) {
      expect(a).toBeLessThan(b);
    }
  });

  it('all pairs are truly adjacent (Manhattan distance 1)', () => {
    const N = 4;
    for (const [a, b] of adjacentPairs(N)) {
      const ca = pieceCoord(N, a);
      const cb = pieceCoord(N, b);
      expect(Math.abs(ca.row - cb.row) + Math.abs(ca.col - cb.col)).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Property tests P3
// Validates: Requirements P3
// ---------------------------------------------------------------------------

describe('P3a — computeEdges covers [0, size] exactly', () => {
  it('edges[0]=0, edges[N]=size, length=N+1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        fc.integer({ min: 64, max: 2048 }),
        (N, size) => {
          const edges = computeEdges(N, size);
          expect(edges[0]).toBe(0);
          expect(edges[N]).toBe(size);
          expect(edges).toHaveLength(N + 1);
        },
      ),
      { endOnFailure: true },
    );
  });
});

describe('P3b — tiles partition the canvas: sum of widths = size, sum of heights = size', () => {
  it('width sum and height sum equal size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }),
        fc.integer({ min: 64, max: 2048 }),
        (N, size) => {
          let totalW = 0;
          let totalH = 0;
          for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
              const r = pieceRect(N, size, row, col);
              if (row === 0) totalW += r.w;
              if (col === 0) totalH += r.h;
            }
          }
          expect(totalW).toBe(size);
          expect(totalH).toBe(size);
        },
      ),
      { endOnFailure: true },
    );
  });
});

describe('P3c — pieceIndex and pieceCoord are inverses', () => {
  it('round-trip for all pieces in any N×N grid', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 16 }), (N) => {
        for (let i = 0; i < N * N; i++) {
          const { row, col } = pieceCoord(N, i);
          expect(pieceIndex(N, row, col)).toBe(i);
        }
      }),
      { endOnFailure: true },
    );
  });
});

describe('P3d — neighbor counts: corners=2, edges=3, interior=4', () => {
  it('every piece has the correct neighbor count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 16 }), (N) => {
        for (let i = 0; i < N * N; i++) {
          const { row, col } = pieceCoord(N, i);
          const n = neighbors(N, i).length;
          const isCorner =
            (row === 0 || row === N - 1) && (col === 0 || col === N - 1);
          const isEdge =
            !isCorner &&
            (row === 0 || row === N - 1 || col === 0 || col === N - 1);
          if (isCorner) expect(n).toBe(2);
          else if (isEdge) expect(n).toBe(3);
          else expect(n).toBe(4);
        }
      }),
      { endOnFailure: true },
    );
  });
});

describe('P3e — adjacentPairs: count, ordering, adjacency', () => {
  it('count = 2*N*(N-1), all a<b, all pairs Manhattan distance 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 16 }), (N) => {
        const pairs = adjacentPairs(N);
        expect(pairs).toHaveLength(2 * N * (N - 1));
        for (const [a, b] of pairs) {
          expect(a).toBeLessThan(b);
          const ca = pieceCoord(N, a);
          const cb = pieceCoord(N, b);
          const dr = Math.abs(ca.row - cb.row);
          const dc = Math.abs(ca.col - cb.col);
          expect(dr + dc).toBe(1);
        }
      }),
      { endOnFailure: true },
    );
  });
});
