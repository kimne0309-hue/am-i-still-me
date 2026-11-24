/**
 * Pure transition-director model (property-tested).
 *
 * Tracks which scene is current, which is the latest requested destination,
 * and the phase of any in-flight transition. No DOM, no async — plain state.
 *
 * Fields:
 *   current  — the scene currently shown (or the one that was last showing).
 *   target   — the latest scene we have been asked to navigate to.
 *   pending  — the scene whose entrance animation is in progress (only set
 *              during 'entering'); may differ from target if navigate() was
 *              called after exitDone().
 *   phase    — 'idle' | 'exiting' | 'entering'
 */

/** The phase of the director's transition state machine. */
export type Phase = 'idle' | 'exiting' | 'entering';

/** Immutable director snapshot. */
export interface DirectorState {
  readonly current: string;
  readonly target:  string;
  /**
   * The scene actively being entered (defined only during 'entering' phase).
   * In 'idle' and 'exiting' phases this equals target.
   */
  readonly pending: string;
  readonly phase:   Phase;
}

/**
 * Request navigation to `to`.
 * - idle, already on target  → no-op
 * - idle, different target   → start exiting toward `to`
 * - exiting or entering      → update target only (chase the latest request)
 */
export function navigate(state: DirectorState, to: string): DirectorState {
  if (state.phase === 'idle') {
    if (state.current === to) return state;
    return { current: state.current, target: to, pending: to, phase: 'exiting' };
  }
  if (state.target === to) return state;
  // Mid-flight: update target but do not disturb the in-progress animation.
  return { current: state.current, target: to, pending: state.pending, phase: state.phase };
}

/**
 * Signal that the exit animation finished.
 * Transitions 'exiting' → 'entering'. No-op in any other phase.
 * Sets `pending` to the current target so we know which scene is entering.
 */
export function exitDone(state: DirectorState): DirectorState {
  if (state.phase !== 'exiting') return state;
  return { current: state.current, target: state.target, pending: state.target, phase: 'entering' };
}

/**
 * Signal that the entrance animation finished.
 * The scene that just entered (`pending`) becomes current.
 * - pending === target → go idle
 * - pending !== target → a new navigate() arrived mid-flight → exit again
 */
export function enterDone(state: DirectorState): DirectorState {
  if (state.phase !== 'entering') return state;

  const arrived = state.pending;

  if (arrived === state.target) {
    return { current: arrived, target: arrived, pending: arrived, phase: 'idle' };
  }

  // Target changed during the entrance → start exiting toward the new target.
  return { current: arrived, target: state.target, pending: state.target, phase: 'exiting' };
}

/**
 * True when the director is idle on its target (the UI is interactive).
 */
export function isInteractive(state: DirectorState): boolean {
  return state.phase === 'idle' && state.current === state.target;
}

/** Create the initial director state positioned on `initialScene`. */
export function makeDirector(initialScene: string): DirectorState {
  return {
    current: initialScene,
    target:  initialScene,
    pending: initialScene,
    phase:   'idle',
  };
}
