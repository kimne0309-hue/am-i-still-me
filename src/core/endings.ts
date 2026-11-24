/** 8 endings + poetic log pool for the ritual. */

import { shuffle } from './rng';

/** The user's answer to "Are you still you?" */
export type Answer1 = 'yes' | 'no';

/** The user's answer to "Which one is you?" */
export type Answer2 = 'ghost' | 'reassembled' | 'neither' | 'both';

/** One of the 8 possible endings. */
export interface Ending {
  /** Short identifier, e.g. 'faithful-ghost' */
  readonly id: string;
  readonly answer1: Answer1;
  readonly answer2: Answer2;
  readonly title: string;
  readonly body: string;
  /** True for the "Nobody in the Mirror" ending — uses the wound accent color */
  readonly isWound: boolean;
}

/** All 8 endings, one per (answer1, answer2) combination. */
export const ENDINGS: readonly Ending[] = [
  {
    id: 'faithful-ghost',
    answer1: 'yes',
    answer2: 'ghost',
    title: 'The Faithful Ghost',
    body: 'You said you were still you. Then you chose the ghost. Perhaps a self is not made of pieces, but of the one who keeps counting them. You remain: translucent, and certain.',
    isWound: false,
  },
  {
    id: 'contradiction',
    answer1: 'yes',
    answer2: 'reassembled',
    title: 'The Contradiction',
    body: 'You claimed the ghost was still you, then reached for the old pieces. Two of you walk out of this mirror now. Only one of them will be remembered.',
    isWound: false,
  },
  {
    id: 'vanishing',
    answer1: 'yes',
    answer2: 'neither',
    title: 'The Vanishing',
    body: 'You were still you, you said. But you would not claim either face. Then where did you go? The mirror is empty, and it is listening.',
    isWound: false,
  },
  {
    id: 'fleet',
    answer1: 'yes',
    answer2: 'both',
    title: 'The Fleet',
    body: 'You are the ghost. You are the reassembled. You are every version that ever answered. A self, it seems, can sail in more than one ship.',
    isWound: false,
  },
  {
    id: 'stranger',
    answer1: 'no',
    answer2: 'ghost',
    title: 'The Stranger You Became',
    body: 'You said you were gone. Yet you chose the ghost. Maybe you did not want your old self back. Maybe you wanted to meet someone new.',
    isWound: false,
  },
  {
    id: 'old-planks',
    answer1: 'no',
    answer2: 'reassembled',
    title: 'The Old Planks',
    body: 'Not the ghost, you said. You chose the pieces you began with, even out of order. Memory is like that, too: all the parts, slightly wrong, and still home.',
    isWound: false,
  },
  {
    id: 'nobody',
    answer1: 'no',
    answer2: 'neither',
    title: 'Nobody in the Mirror',
    body: 'Not still you, and neither face. The mirror has no one left to show. Close your eyes. Whoever is reading this: who are they?',
    isWound: true,
  },
  {
    id: 'haunting',
    answer1: 'no',
    answer2: 'both',
    title: 'The Haunting',
    body: 'You are no longer you, and yet you are in both frames. Perhaps that is what a ghost is: someone who is everywhere they used to be.',
    isWound: false,
  },
];

/**
 * Look up the ending for a given answer pair. Always returns a result.
 */
export function getEnding(answer1: Answer1, answer2: Answer2): Ending {
  const ending = ENDINGS.find(
    (e) => e.answer1 === answer1 && e.answer2 === answer2,
  );
  // The table is complete — this branch is unreachable with valid inputs.
  if (!ending) throw new RangeError(`No ending for ${answer1}/${answer2}`);
  return ending;
}

/** Poetic log lines shown during the ritual, one per piece replaced. */
export const LOG_POOL: readonly string[] = [
  'The mirror takes a little more.',
  'Something cold settles here.',
  'This part no longer remembers you.',
  'You did not feel that, did you?',
  'One more plank. Same ship?',
  'The reflection hesitates.',
  'Who is counting now?',
  'It fits better than before.',
];

/**
 * Creates a no-repeat log picker backed by the given RNG.
 * Returns lines in a shuffled order; reshuffles when exhausted.
 * Never returns the same line twice in a row across reshuffles.
 */
export function makeLogPicker(rng: () => number): () => string {
  let deck: string[] = shuffle(rng, LOG_POOL);
  let index = 0;
  let lastYielded = '';

  return function pick(): string {
    if (index >= deck.length) {
      const reshuffled = shuffle(rng, LOG_POOL);
      // Avoid starting the new deck with the same line we just ended on.
      if (reshuffled[0] === lastYielded && reshuffled.length > 1) {
        // Swap position 0 with position 1.
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }
      deck = reshuffled;
      index = 0;
    }
    const line = deck[index++];
    lastYielded = line;
    return line;
  };
}
