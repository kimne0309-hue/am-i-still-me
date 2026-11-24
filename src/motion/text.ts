/**
 * Text animation helpers: dropLetters (M4), floatWords (M5), lettersOut,
 * wobbleQuestion, and restoreText.
 *
 * Accessibility: animated elements expose their full text via `aria-label`.
 * Letter and word spans are `aria-hidden="true"`.
 */

import { enter, leave, anim, prefersReducedMotion } from './animate.js';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface DropLettersOptions {
  /** Stagger between letters in ms. Default 32. */
  stagger?: number;
  /** Initial delay before first letter in ms. Default 0. */
  delay?: number;
}

export interface FloatWordsOptions {
  /** Stagger between words in ms. Default 40. */
  stagger?: number;
  /** Initial delay before first word in ms. Default 0. */
  delay?: number;
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * Split text into `.wd > .ltr` spans (words never break mid-word).
 * Sets `aria-label` and caches original text in `data-text`.
 * Letter spans are `aria-hidden="true"`.
 */
function splitLetters(el: HTMLElement, text: string): HTMLElement[] {
  el.setAttribute('aria-label', text);
  el.dataset.text = text;
  el.innerHTML = '';

  const words = text.split(' ');
  const letters: HTMLElement[] = [];

  words.forEach((word, wi) => {
    const wd = document.createElement('span');
    wd.className = 'wd';
    wd.setAttribute('aria-hidden', 'true');

    for (const char of word) {
      const ltr = document.createElement('span');
      ltr.className = 'ltr';
      ltr.setAttribute('aria-hidden', 'true');
      ltr.style.display = 'inline-block';
      ltr.style.willChange = 'transform, opacity';
      ltr.textContent = char;
      wd.appendChild(ltr);
      letters.push(ltr);
    }

    el.appendChild(wd);

    // Add a space text node between words (but not after the last word)
    if (wi < words.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });

  return letters;
}

/**
 * Split text into `.wd` word spans (no inner letter spans).
 * Sets `aria-label` and caches original text in `data-text`.
 * Word spans are `aria-hidden="true"`.
 */
function splitWords(el: HTMLElement, text: string): HTMLElement[] {
  el.setAttribute('aria-label', text);
  el.dataset.text = text;
  el.innerHTML = '';

  const words = text.split(' ');
  const wordEls: HTMLElement[] = [];

  words.forEach((word, wi) => {
    const wd = document.createElement('span');
    wd.className = 'wd';
    wd.setAttribute('aria-hidden', 'true');
    wd.style.display = 'inline-block';
    wd.style.willChange = 'transform, opacity, filter';
    wd.textContent = word;
    el.appendChild(wd);
    wordEls.push(wd);

    if (wi < words.length - 1) {
      el.appendChild(document.createTextNode(' '));
    }
  });

  return wordEls;
}

// ---------------------------------------------------------------------------
// dropLetters (M4)
// ---------------------------------------------------------------------------

/**
 * Split `el`'s text into `.wd > .ltr` spans, set `aria-label`, cache original
 * text in `data-text`, then animate each letter in with M4:
 * `translateY(-.7em) rotate(±13°) scale(.6)` → none with the `pop` preset,
 * staggered 22–48 ms (default 32 ms).
 *
 * In reduced motion: fades the whole element in instead.
 * Returns a Promise that resolves when all letters have landed.
 */
export async function dropLetters(
  el: HTMLElement,
  opts: DropLettersOptions = {},
): Promise<void> {
  const text = el.textContent?.trim() ?? '';
  const rm = prefersReducedMotion();

  if (rm) {
    // Reduced motion: fade the whole element
    el.style.opacity = '0';
    el.style.willChange = 'opacity';
    await enter(el, [{ opacity: 0 }, { opacity: 1 }], { ease: 'gentle', dur: 200 });
    el.style.willChange = '';
    return;
  }

  const letters = splitLetters(el, text);
  const staggerMs = opts.stagger ?? 32;
  const baseDelay = opts.delay ?? 0;

  const promises = letters.map((ltr, i) => {
    // Alternate rotation direction by index
    const sign = i % 2 === 0 ? 1 : -1;
    const rot = sign * 13;
    return enter(
      ltr,
      [
        {
          opacity: 0,
          transform: `translateY(-.7em) rotate(${rot}deg) scale(.6)`,
          offset: 0,
        },
        {
          opacity: 1,
          transform: 'translateY(0) rotate(0deg) scale(1)',
          offset: 1,
        },
      ],
      { ease: 'pop', delay: baseDelay + i * staggerMs },
    );
  });

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// wobbleQuestion (M4 wobble)
// ---------------------------------------------------------------------------

/**
 * Animate the "?" letter span in `el` with M4's post-land wobble:
 * rotate −16° → 11° → −4° → 0, 760 ms, `gentle` preset.
 *
 * Finds the last `.ltr` span whose textContent is "?". No-ops if not found
 * or in reduced motion.
 */
export async function wobbleQuestion(el: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return;

  const letters = el.querySelectorAll<HTMLElement>('.ltr');
  let questionSpan: HTMLElement | null = null;

  // Find the last "?" letter span
  for (let i = letters.length - 1; i >= 0; i--) {
    if (letters[i].textContent === '?') {
      questionSpan = letters[i];
      break;
    }
  }

  if (!questionSpan) return;

  await anim(
    questionSpan,
    [
      { transform: 'rotate(-16deg)', offset: 0 },
      { transform: 'rotate(11deg)', offset: 0.4 },
      { transform: 'rotate(-4deg)', offset: 0.75 },
      { transform: 'rotate(0deg)', offset: 1 },
    ],
    { ease: 'gentle', dur: 760 },
  );
}

// ---------------------------------------------------------------------------
// floatWords (M5)
// ---------------------------------------------------------------------------

/**
 * Split `text` into `.wd` word spans in `el`, set `aria-label`, cache original
 * text in `data-text`, then animate each word in with M5:
 * `translateY(12px) blur(6px)` → none with the `gentle` preset, stagger 40 ms.
 *
 * In reduced motion: fades the whole element in instead.
 * Returns a Promise that resolves when all words have appeared.
 */
export async function floatWords(
  el: HTMLElement,
  text: string,
  opts: FloatWordsOptions = {},
): Promise<void> {
  const rm = prefersReducedMotion();

  if (rm) {
    el.style.opacity = '0';
    el.style.willChange = 'opacity';
    await enter(el, [{ opacity: 0 }, { opacity: 1 }], { ease: 'gentle', dur: 200 });
    el.style.willChange = '';
    return;
  }

  const words = splitWords(el, text);
  const staggerMs = opts.stagger ?? 40;
  const baseDelay = opts.delay ?? 0;

  const promises = words.map((wd, i) =>
    enter(
      wd,
      [
        {
          opacity: 0,
          transform: 'translateY(12px)',
          filter: 'blur(6px)',
          offset: 0,
        },
        {
          opacity: 1,
          transform: 'translateY(0)',
          filter: 'blur(0px)',
          offset: 1,
        },
      ],
      { ease: 'gentle', delay: baseDelay + i * staggerMs },
    ),
  );

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// lettersOut
// ---------------------------------------------------------------------------

/**
 * Animate all `.ltr` spans in `el` out: opacity→0, `translateY(-.5em)`,
 * 200 ms, stagger 10 ms per letter.
 *
 * Falls back to fading the whole element when there are no `.ltr` spans
 * (e.g. word-only splits) or in reduced motion.
 * Returns a Promise that resolves when done.
 */
export async function lettersOut(el: HTMLElement): Promise<void> {
  const rm = prefersReducedMotion();
  const letters = el.querySelectorAll<HTMLElement>('.ltr');

  if (rm || letters.length === 0) {
    await leave(el, [{ opacity: 1 }, { opacity: 0 }], { ease: 'gentle', dur: 200 });
    return;
  }

  const promises = Array.from(letters).map((ltr, i) =>
    leave(
      ltr,
      [
        { opacity: 1, transform: 'translateY(0)', offset: 0 },
        { opacity: 0, transform: 'translateY(-.5em)', offset: 1 },
      ],
      { ease: 'in', dur: 200, delay: i * 10 },
    ),
  );

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// restoreText
// ---------------------------------------------------------------------------

/**
 * Restore `el`'s text to its `data-text` value and remove all `.wd`/`.ltr`
 * spans. Call this after a scene is hidden to clean up split text.
 * No-ops when `data-text` is absent.
 */
export function restoreText(el: HTMLElement): void {
  const original = el.dataset.text;
  if (original === undefined) return;
  el.removeAttribute('aria-label');
  delete el.dataset.text;
  el.textContent = original;
  el.style.opacity = '';
  el.style.willChange = '';
}
