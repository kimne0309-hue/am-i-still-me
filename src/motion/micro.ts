/**
 * Micro-interactions: squishy (M2), tilt (M6), wiggle (M11), shake, toast (M15).
 */

import { anim, enter, leave, wait, prefersReducedMotion } from './animate.js';
import { Spring, PRESETS } from './spring.js';
import { subscribe, unsubscribe } from './ticker.js';
import type { TickFn } from './ticker.js';

// ---------------------------------------------------------------------------
// M2 — squishy: button press squash/stretch
// ---------------------------------------------------------------------------

/**
 * M2 — Attach button press squash/stretch to a button element.
 * pointerdown → scale(1.06, .88) 130 ms out ease
 * pointerup/pointercancel/pointerleave → scale(1,1) with jelly
 * Enter/Space keydown: same with a 90 ms hold before release
 * No-op in reduced motion.
 * Returns a cleanup function.
 */
export function squishy(btn: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};

  let pressing = false;

  const onDown = (): void => {
    pressing = true;
    anim(
      btn,
      [
        { transform: 'scale(1, 1)', offset: 0 },
        { transform: 'scale(1.06, .88)', offset: 1 },
      ],
      { ease: 'out', dur: 130, fill: 'forwards' },
    );
  };

  const onUp = (): void => {
    if (!pressing) return;
    pressing = false;
    anim(
      btn,
      [
        { transform: 'scale(1.06, .88)', offset: 0 },
        { transform: 'scale(1, 1)', offset: 1 },
      ],
      { ease: 'jelly', fill: 'forwards' },
    );
  };

  const onKey = async (e: KeyboardEvent): Promise<void> => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.repeat) return;
    onDown();
    await wait(90);
    onUp();
  };

  btn.addEventListener('pointerdown', onDown);
  btn.addEventListener('pointerup', onUp);
  btn.addEventListener('pointercancel', onUp);
  btn.addEventListener('pointerleave', onUp);
  btn.addEventListener('keydown', onKey as EventListener);

  return () => {
    btn.removeEventListener('pointerdown', onDown);
    btn.removeEventListener('pointerup', onUp);
    btn.removeEventListener('pointercancel', onUp);
    btn.removeEventListener('pointerleave', onUp);
    btn.removeEventListener('keydown', onKey as EventListener);
  };
}

// ---------------------------------------------------------------------------
// M6 — tilt: 3D card tilt toward the mouse pointer
// ---------------------------------------------------------------------------

/**
 * M6 — Attach 3D card tilt to an element. Mouse only.
 * rotateX ±7°, rotateY ±8° toward the pointer with the `follow` preset.
 * On mouseleave: return to 0 with `jelly`.
 * No-op in reduced motion.
 * Returns a cleanup function.
 */
export function tilt(card: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};

  const springX = new Spring(0, PRESETS.follow);
  const springY = new Spring(0, PRESETS.follow);
  let hovering = false;

  const tick: TickFn = (dt: number): boolean | void => {
    springX.step(dt);
    springY.step(dt);
    card.style.transform =
      `perspective(600px) rotateX(${springX.x.toFixed(2)}deg) rotateY(${springY.x.toFixed(2)}deg)`;
    // Unsubscribe when at rest and the pointer has left
    if (!hovering && springX.done && springY.done) {
      card.style.transform = '';
      return false;
    }
  };

  const onMove = (e: MouseEvent): void => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);   // −1 … 1
    const ny = (e.clientY - cy) / (rect.height / 2);  // −1 … 1
    springX.to(ny * -7, PRESETS.follow);
    springY.to(nx * 8, PRESETS.follow);
    if (!hovering) {
      hovering = true;
      subscribe(tick);
    }
  };

  const onLeave = (): void => {
    hovering = false;
    springX.to(0, PRESETS.jelly);
    springY.to(0, PRESETS.jelly);
    // The tick loop is already running and will unsubscribe when both springs rest.
    // If not yet subscribed (pointer moved into element and immediately left),
    // subscribe so the springs settle.
    subscribe(tick);
  };

  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);

  return () => {
    card.removeEventListener('mousemove', onMove);
    card.removeEventListener('mouseleave', onLeave);
    unsubscribe(tick);
    card.style.transform = '';
  };
}

// ---------------------------------------------------------------------------
// M11 — wiggle: idle REPLACE button hint
// ---------------------------------------------------------------------------

/**
 * M11 — Wiggle an element (rotate −5°/4°/−2°/0, scale 1.05, 680 ms).
 * Used for the idle REPLACE button hint after 5 s of no replacement.
 * No-op in reduced motion.
 */
export async function wiggle(el: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return;
  await anim(
    el,
    [
      { transform: 'rotate(0deg) scale(1)',     offset: 0 },
      { transform: 'rotate(-5deg) scale(1.05)', offset: 0.2 },
      { transform: 'rotate(4deg) scale(1.05)',  offset: 0.5 },
      { transform: 'rotate(-2deg) scale(1)',    offset: 0.8 },
      { transform: 'rotate(0deg) scale(1)',     offset: 1 },
    ],
    { ease: 'gentle', dur: 680 },
  );
}

// ---------------------------------------------------------------------------
// shake: decaying positional shake
// ---------------------------------------------------------------------------

/**
 * Shake an element: decaying positional steps over `duration` ms.
 * Defaults: amplitude 7 px, duration 480 ms, 10 steps.
 * Used for screen shake in T4.
 * No-op in reduced motion.
 */
export async function shake(
  el: HTMLElement,
  opts: { amplitude?: number; duration?: number; steps?: number } = {},
): Promise<void> {
  if (prefersReducedMotion()) return;
  const { amplitude = 7, duration = 480, steps = 10 } = opts;
  const stepMs = duration / steps;
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    const offset = amplitude * decay * (i % 2 === 0 ? 1 : -1);
    el.style.transform = `translateX(${offset}px)`;
    await wait(stepMs);
  }
  el.style.transform = '';
}

// ---------------------------------------------------------------------------
// M15 — showToast
// ---------------------------------------------------------------------------

/**
 * M15 — Show a toast message.
 * Creates a .toast element, appends to document.body, animates in with
 * the pop easing (y+16 px, scale .96 → 1), auto-hides after 3.4 s with
 * a 300 ms fade, then removes from DOM.
 * Returns a cleanup function; call it to dismiss early.
 */
export function showToast(message: string): () => void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  // Inline base styles so the element is usable before CSS is loaded.
  toast.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'left:50%',
    'transform:translateX(-50%)',
    `z-index:var(--z-toast,8)`,
    'background:rgba(15,15,22,.94)',
    'color:var(--bone,#e8e4da)',
    'padding:12px 24px',
    'border-radius:14px',
    'font-size:.85rem',
    'pointer-events:none',
    'white-space:nowrap',
    'opacity:0',
  ].join(';');
  document.body.appendChild(toast);

  let cancelled = false;

  const cleanup = (): void => {
    if (cancelled) return;
    cancelled = true;
    toast.remove();
  };

  void (async () => {
    // Pop in
    await enter(
      toast,
      [
        { opacity: 0, transform: 'translateX(-50%) translateY(16px) scale(.96)', offset: 0 },
        { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)',      offset: 1 },
      ],
      { ease: 'pop' },
    );

    if (cancelled) return;
    await wait(3400);
    if (cancelled) return;

    // Fade out
    await leave(
      toast,
      [
        { opacity: 1, offset: 0 },
        { opacity: 0, offset: 1 },
      ],
      { ease: 'gentle', dur: 300 },
    );

    if (!cancelled) {
      cancelled = true;
      toast.remove();
    }
  })();

  return cleanup;
}
