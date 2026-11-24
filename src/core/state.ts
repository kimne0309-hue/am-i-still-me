/** FSM v2 (states, events, transition table) + SessionData reducer. */

export type AppState =
  | 'landing'
  | 'offering'
  | 'framing'
  | 'preparing'
  | 'ritual'
  | 'question1'
  | 'secondShip'
  | 'verdict'
  | 'restoring'
  | 'restored';

export type AppEvent =
  | 'BEGIN'
  | 'IMAGE_READY'
  | 'IMAGE_ERROR'
  | 'BACK'
  | 'START'
  | 'PREPARED'
  | 'PREPARE_ERROR'
  | 'ALL_REPLACED'
  | 'ANSWER1'
  | 'ANSWER2'
  | 'RESTORE'
  | 'RESTORED'
  | 'RESTART';

/** All valid app states. */
export const ALL_STATES: readonly AppState[] = [
  'landing',
  'offering',
  'framing',
  'preparing',
  'ritual',
  'question1',
  'secondShip',
  'verdict',
  'restoring',
  'restored',
];

/** All valid app events. */
export const ALL_EVENTS: readonly AppEvent[] = [
  'BEGIN',
  'IMAGE_READY',
  'IMAGE_ERROR',
  'BACK',
  'START',
  'PREPARED',
  'PREPARE_ERROR',
  'ALL_REPLACED',
  'ANSWER1',
  'ANSWER2',
  'RESTORE',
  'RESTORED',
  'RESTART',
];

/**
 * Full transition table: maps state → (event → next state).
 * Only valid transitions are listed; everything else falls through to same-state.
 */
const TABLE: Partial<Record<AppState, Partial<Record<AppEvent, AppState>>>> = {
  landing: {
    BEGIN: 'offering',
  },
  offering: {
    IMAGE_READY: 'framing',
    IMAGE_ERROR: 'offering',
    BACK: 'landing',
  },
  framing: {
    BACK: 'offering',
    START: 'preparing',
  },
  preparing: {
    PREPARED: 'ritual',
    PREPARE_ERROR: 'framing',
  },
  ritual: {
    ALL_REPLACED: 'question1',
  },
  question1: {
    ANSWER1: 'secondShip',
  },
  secondShip: {
    ANSWER2: 'verdict',
  },
  verdict: {
    RESTORE: 'restoring',
  },
  restoring: {
    RESTORED: 'restored',
  },
  restored: {},
};

/**
 * Pure FSM transition function. Invalid events return the same state.
 * RESTART from any non-landing state → landing.
 */
export function transition(state: AppState, event: AppEvent): AppState {
  if (event === 'RESTART' && state !== 'landing') {
    return 'landing';
  }
  const row = TABLE[state];
  if (row) {
    const next = row[event];
    if (next !== undefined) return next;
  }
  return state;
}

// ── SessionData ──────────────────────────────────────────────────────────────

export interface SessionData {
  readonly seed: number;
  readonly gridSize: number; // 4, 6 or 8
  readonly replacementOrder: number[];
  readonly effectByPiece: number[];
  readonly map: number[]; // reassemblyMap[slot] = piece
  readonly inverseMap: number[]; // inverseMap[piece] = slot
  readonly replacedCount: number;
  readonly answer1?: 'yes' | 'no';
  readonly answer2?: 'ghost' | 'reassembled' | 'neither' | 'both';
}

export type SessionAction =
  | {
      type: 'INIT';
      seed: number;
      gridSize: number;
      replacementOrder: number[];
      effectByPiece: number[];
      map: number[];
      inverseMap: number[];
    }
  | { type: 'PIECE_REPLACED' }
  | { type: 'SET_ANSWER1'; answer: 'yes' | 'no' }
  | { type: 'SET_ANSWER2'; answer: 'ghost' | 'reassembled' | 'neither' | 'both' };

/**
 * Returns a blank initial SessionData with zeroed-out values.
 * Used as a placeholder before INIT is dispatched.
 */
export function initialSession(): SessionData {
  return {
    seed: 0,
    gridSize: 4,
    replacementOrder: [],
    effectByPiece: [],
    map: [],
    inverseMap: [],
    replacedCount: 0,
  };
}

/**
 * Pure session reducer. Returns a new SessionData; never mutates the input.
 */
export function sessionReducer(session: SessionData, action: SessionAction): SessionData {
  switch (action.type) {
    case 'INIT':
      return {
        seed: action.seed,
        gridSize: action.gridSize,
        replacementOrder: action.replacementOrder,
        effectByPiece: action.effectByPiece,
        map: action.map,
        inverseMap: action.inverseMap,
        replacedCount: 0,
      };
    case 'PIECE_REPLACED':
      return { ...session, replacedCount: session.replacedCount + 1 };
    case 'SET_ANSWER1':
      return { ...session, answer1: action.answer };
    case 'SET_ANSWER2':
      return { ...session, answer2: action.answer };
  }
}
