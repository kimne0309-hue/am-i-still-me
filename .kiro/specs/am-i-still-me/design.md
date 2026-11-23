# Design Document — "Am I Still Me?" (v2)

## 1. Overview
A static Vite + TypeScript single-page app. A small finite state machine (FSM) decides **which** scene is active. A scene manager with arrive/depart choreographies decides **how** scenes change. Pure logic (`src/core`, `src/motion/spring.ts`) is separated from Canvas, WAAPI, audio and DOM layers, and covered by property tests. Visual rules: design-system.md. Motion rules: motion.md. Test plan: qa.md.

## 2. Architecture
```
main.ts ── creates AppContext { fsm, session, rng, sound, portraits, ticker, epoch }
   │
   ├─ core/ (pure)            rng · grid · replacement · schedule · state(FSM v2) · director-model · endings · i18n
   ├─ motion/                 ticker · spring(Spring, Prop) · easings · animate(anim/enter/leave) · text · micro
   ├─ render/                 image · effects · precompute · portrait-view · fx · atmosphere · certificate
   ├─ audio/sound.ts          synth voices
   └─ ui/
       ├─ scenes.ts           go(to, ctx) · jump(name) · show() · input lock · epoch
       ├─ portraits.ts        shared-element layer: place() FLIP · layoutFor(scene) · relayout observer · layoutDrift()
       ├─ screens/*.ts        { arrive(ep, ctx), depart(ep, ctx) } per scene
       ├─ transitions/        ink-drop ring · shade · mist wall
       └─ components/         leave button + confirm dialog · toggles · odometer
```
- **Background layers** (fog, grain, candle) are mounted once and live forever.
- **Portrait layer**: up to three wrappers live in a fixed layer above the fog and below the scenes: A (main/ghost portrait), B (reassembled), E (empty fog frame for "Neither"). Each wrapper holds a frame and one 1024×1024 canvas. Scenes contain invisible `.slot` placeholders. Wrappers travel to slots (§7).
- **FX layer**: one full-screen canvas for particles and flying tiles.

## 3. State machine v2 (`core/state.ts`)
| State | Event → Next |
|---|---|
| `landing` | BEGIN → offering |
| `offering` | IMAGE_READY → framing · IMAGE_ERROR → offering · **BACK → landing** |
| `framing` | BACK → offering · START → preparing |
| `preparing` | PREPARED → ritual · **PREPARE_ERROR → framing** |
| `ritual` | ALL_REPLACED → question1 |
| `question1` | ANSWER1 → secondShip |
| `secondShip` | ANSWER2 → verdict |
| `verdict` | RESTORE → restoring |
| `restoring` | RESTORED → restored |
| **every state ≠ landing** | **RESTART → landing** (escape hatch: Leave button, Escape key, BEGIN AGAIN, global error) |

- `transition(state, event)` is pure. Invalid events return the same state (P6). Every non-landing state reaches landing in one RESTART (P7).
- v1 had no RESTART in 7 states and no PREPARE_ERROR. A failed preparation would have frozen the app. Found by verification (Appendix A).
- `SessionData` (immutable, updated by a pure reducer): `{ seed, gridSize, replacementOrder, effectByPiece, reassemblyMap, inverseMap, replacedCount, answer1?, answer2? }`.

## 4. Core algorithms
- **RNG**: `mulberry32(seed)`. The per-run seed is `(seed XOR imul(N, 2654435761)) >>> 0`, so each grid size gets its own sequence. Helpers `pick`, `shuffle` (Fisher–Yates, returns a new array), `range`.
- **Grid**: `edges[i] = round(i · size / N)`. Rects use consecutive edges, so they tile exactly (P3).
- **Replacement order**: `shuffle(rng, range(N²))`. Restore order = reversed (P1, P9).
- **Effect assignment**: in raster order, pick a random effect; if it equals the left or top neighbor's, re-pick up to 3 times (P4: < 20%).
- **Reassembly map**: identity; `k = max(2, round(0.15·N²))`, `pairs = ceil(k/2)`. Shuffle all adjacent slot pairs and greedily swap pairs whose slots are both unused. A greedy maximal matching on an N×N grid has ≥ N²/4 pairs, so the greedy pass always finds enough (P5). `inverseMap[piece] = slot`.
- **Auto schedule**: `interval(i) = max(0.18, 1.2·0.92^i)` seconds (P14).
- **Director model** (`core/director-model.ts`): a pure model of the scene manager, with phases `idle | exiting | entering`. It always enters the **latest** target, mounts exactly one screen, and is interactive only when idle on its target (P13). The real scene manager follows the same rules.

## 5. Ghost effects v2 (`render/effects.ts`)
All effects take the portrait's RGBA pixels (1024², read back **once**) and return a new array. `L = 0.2126R + 0.7152G + 0.0722B`. `s = width/512` scales pixel distances.
| Effect | Formula |
|---|---|
| Spectral | `L' = min(255, ((L−128)·0.85 + 128)·1.12 + 6)`; RGB = `(0.66 L', 0.93 L', 0.98 L')`. Cold, darks stay dark |
| Glitch | horizontal bands of height `(4…24)·s`; 32% of bands shift x by `±(4…20)·s` with wraparound; R sampled at `+3s`, B at `−3s` (×1.1), G ×0.96 |
| Negative Blur | invert → box blur radius `3s` twice (separable) → `L'' = 0.42·L`; RGB = `(0.72 L'', 0.95 L'', L''+8)`. **v2: darkened** (v1 turned dark backgrounds white) |
| Static | per pixel noise `±44·((1−L/255)·0.6+0.4)` mixed with 20% luminance; every `max(2, 3s)`-th row ×0.72 |
| Echo | 60/40 blend with the copy offset by `(+6s, −4s)`, then desaturate 45% and multiply `(0.82, 0.96, 1.04)` |
Precompute: 5 full-image passes, one per animation frame (chunked). Each piece's ghost tile is cut from its assigned effect image, so no seams appear. Glow tile: a 256 px canvas with 16 px inset cyan gradients (30% → 0) plus a 3.5% fill, scaled per tile. Overlay (cached 1024² canvas): scanlines every 4 px (11% black, 1.6 px) plus a radial vignette (330 → 740 px, to 50% black).

## 6. Endings and log pool (`core/endings.ts`)
| A1 | A2 | Title | Body |
|---|---|---|---|
| yes | ghost | The Faithful Ghost | You said you were still you. Then you chose the ghost. Perhaps a self is not made of pieces, but of the one who keeps counting them. You remain: translucent, and certain. |
| yes | reassembled | The Contradiction | You claimed the ghost was still you, then reached for the old pieces. Two of you walk out of this mirror now. Only one of them will be remembered. |
| yes | neither | The Vanishing | You were still you, you said. But you would not claim either face. Then where did you go? The mirror is empty, and it is listening. |
| yes | both | The Fleet | You are the ghost. You are the reassembled. You are every version that ever answered. A self, it seems, can sail in more than one ship. |
| no | ghost | The Stranger You Became | You said you were gone. Yet you chose the ghost. Maybe you did not want your old self back. Maybe you wanted to meet someone new. |
| no | reassembled | The Old Planks | Not the ghost, you said. You chose the pieces you began with, even out of order. Memory is like that, too: all the parts, slightly wrong, and still home. |
| no | neither | Nobody in the Mirror *(wound)* | Not still you, and neither face. The mirror has no one left to show. Close your eyes. Whoever is reading this: who are they? |
| no | both | The Haunting | You are no longer you, and yet you are in both frames. Perhaps that is what a ghost is: someone who is everywhere they used to be. |
(v1's "Nobody in the Mirror" had 5 sentences, breaking the 2–4 rule. Fixed.)

Poetic log pool: "The mirror takes a little more." · "Something cold settles here." · "This part no longer remembers you." · "You did not feel that, did you?" · "One more plank. Same ship?" · "The reflection hesitates." · "Who is counting now?" · "It fits better than before."

## 7. Shared-element portraits (`ui/portraits.ts`)
- `place(key, rect, { animate, ease = 'gentle', opacity, delay, pop })`:
  1. `prev = wrapper.getBoundingClientRect()` if visible. This includes any running transform, so interruptions retarget smoothly.
  2. Set `left/top/width/height/opacity` to the new slot rect (final state first).
  3. If visible before: animate `translate(Δcenter) scale(prev/new)` → none (transform-origin center, `fill: backwards`). If newly shown: pop in from `scale(.4) rotate(-6°)`. If the rect is null: fade out and scale to .9.
- `layoutFor(scene)` maps scene → slots: framing/ritual/question → A; ship → A + B; verdict → A, B, both (B at 50%), or E, depending on Answer 2.
- **Measure after content**: put text into the DOM (split letters, words) **before** measuring slots. In v1 the verdict text was set after measuring, and the column re-centered, so the portrait overlapped the title.
- **Relayout observer**: a `ResizeObserver` on every direct child of every scene → rAF-debounced `layoutFor(current, { animate: true, ease: 'gentle' })`. Skipped while `layoutLocked` (from the start of a departure until the destination is shown), so exit animations never get yanked back. Window resize re-places instantly.
- `layoutDrift()` returns the max px difference between visible wrappers and their slots. e2e asserts ≤ 2 px after settling (R17.6).

## 8. Rendering
### 8.1 Image pipeline (`render/image.ts`)
`createImageBitmap(file, { imageOrientation: 'from-image' })`, falling back to an `<img>` decode. Validate type and size. Fill transparency with `--void`. The user's pan/zoom define a source square, drawn into a 1024² canvas (minimum 512 if the source is smaller). The `?test=1` fixture is a painted demo portrait drawn in code.

### 8.2 PortraitView (`render/portrait-view.ts`)
- Tiles: `{ x, y, w, h, row, col, piece, face: 'original' | 'ghost' | 'empty', effect, z, props }`. Props are `Prop` objects (a spring plus an optional tween): `ox, oy, rot, sc, sy, flip, alpha`. View-level: `wob` (spring applied as a CSS scale on the frame wrapper), `flash`, `gridAlpha`.
- Frame loop: step only busy props. Redraw if anything changed. Unsubscribe from the Ticker when everything rests. `invalidate()` resubscribes.
- Draw: fill `#0a0b10` → dashed outlines for empty tiles → tiles sorted by `z` (lifted on top). Fast path: a resting tile is drawn with plain `drawImage` at integer coordinates (no seams). Animated tiles are translated to their center, rotated, and scaled by `(sc·flip, sc·sy)` with a minimum magnitude of 1e-3. Lifted tiles get a shadow (blur 36, y 14). Ghost tiles get the glow tile. Then the grid lines (preview alpha or crack flash, 3 px + glow when flashing). Then the overlay.
- `tileScreen(i)` converts a tile center to screen coordinates (for particles and fly-back).
- Swap choreography = M13. Shatter = T3. Fly-back landing = motion.md §6.

### 8.3 FX layer (`render/fx.ts`)
Full-screen canvas, DPR ≤ 2, resized on window resize. `burst(type, x, y, size, count)` and `fly(spec) → Promise` (resolves on landing; in reduced motion, lands immediately). `clear()` resolves pending flyers. Pre-rendered radial sprites for spark, dust and smoke. Unsubscribes when empty (clears the canvas first).

### 8.4 Atmosphere (`render/atmosphere.ts`)
- **Fog**: a 160×90 canvas. A 64² value-noise lattice with smoothstep interpolation. Two octaves: `(x·0.022 + 0.05t, y·0.032 + 0.01t)` and `(x·0.055 − 0.09t, y·0.06 + 0.025t)` mixed .65/.35, thresholded at .4, alpha ≤ 115·(0.5 + 0.5·y/H), color (150,176,184). Renders at about 20 fps. CSS `blur(26px)`.
- **Grain**: a 128² noise tile generated once and used as a data URL background.
- **Candle**: a 620 px element moved by `translate3d` every frame (compositor only, so no full-screen repaints).
- **Shade**: a 260vmax circle element with a radial gradient (transparent to 9%, dark at 17%+). Centered on the question slot and re-centered on resize.
- **Mist wall**: three layered radial gradients (pale highlights over `rgba(70,86,92,.96)` → `rgba(22,27,31,.98)`) with `blur(12px)`.

### 8.5 Certificate (`render/certificate.ts`)
See design-system.md. Exported with `canvas.toBlob('image/png')`. If the anchor download fails, fall back to `window.open(blobURL)` plus a toast.

## 9. Audio (`audio/sound.ts`)
One AudioContext, created and resumed on the first gesture. Master gain 0.75, set to 0 when muted (via `setTargetAtTime` 0.06).
| Voice | Recipe |
|---|---|
| click | sine 880→560 Hz over 50 ms, env peak .045 (4 ms attack, 60 ms release) |
| whisper | white noise → bandpass 1.2–2.4 kHz (random) Q 6 → env .17 (40 ms / 340 ms) → StereoPanner(column) · max 6 voices |
| tick | noise → highpass 3.2 kHz → env .06 (2 / 30 ms) |
| thud | sine 120→48 Hz over 180 ms, env .22 |
| crack | noise → highpass 1.8 kHz → env .14 (2 / 180 ms) + thud |
| whoosh | noise → bandpass Q 1.4 sweeping 300→2600 Hz over 550 ms, env .12 (180 / 450 ms) |
| toll | sines 98 Hz (.22), 196 (.07), 145.2 (.05), 392.4 (.025), exponential decay over 4.2 s |
| drone | sines 55 + 55.4 Hz + triangle 110 → lowpass 420 Hz (LFO 0.05 Hz ±160 Hz) → gain fades in to .035 over 4 s |

## 10. Motion engine and scene manager
```ts
// motion/spring.ts (pure)
export const PRESETS = { snappy:{k:420,c:27}, pop:{k:256,c:16}, jelly:{k:380,c:11}, gentle:{k:70,c:13}, follow:{k:140,c:24} };
export class Spring {
  x; v = 0; target; p; acc = 0; travel = 1; done = true;
  to(target, preset?, vel = 0) { /* reduced motion → set(target) */ this.travel = Math.max(Math.abs(target - this.x), Math.abs(vel) / Math.sqrt(this.p.k), 1e-6); this.target = target; this.v += vel; this.done = false; }
  kick(vel, preset?) { this.to(this.target, preset, vel); }
  step(dt) { this.acc += dt; const h = 1/240; while (this.acc >= h) { const a = -k*(x-target) - c*v; v += a*h; x += v*h; this.acc -= h; }
             if (|x-target| < max(5e-4*travel, 1e-3) && |v| < max(5e-3*travel, 1e-2)) set(target); }
}
// Prop = Spring + optional tween { from, to, dur, ease } used for flips (ease-in to 0).
```
- `anim(el, frames, { ease, dur, delay, fill })`: WAAPI with `EASE[ease]` (a linear() string or fallback) and `DUR[ease]`, `playbackRate = speed`. In reduced motion it keeps only the opacity keyframes (200 ms), or finishes instantly. Returns `finished` (cancellation resolves to null and never throws). `enter()` = `fill: 'backwards'`, `leave()` = `fill: 'forwards'`.
- Text helpers: `dropLetters(el, {stagger, delay})` splits text into `.wd` word spans containing `.ltr` letter spans (words never break mid-word), sets `aria-label`, and caches the original text in `data-text`. `floatWords(el, text, …)` and `lettersOut(el)` work the same way.
- **Scene manager** (`ui/scenes.ts`):
```ts
async function go(to, ctx) {
  if (busy || to === current) return;
  const ep = EPOCH; lock(true); layoutLocked = true;
  try {
    await screens[current].depart(ep, { ...ctx, to }); if (ep !== EPOCH) return;
    fsmPrepare(to, ctx);                         // e.g. build the run for ritual
    show(to, { keep: from, keepMs: KEEP[from] }); layoutLocked = false;   // landing keeps 800 ms for the ink drop
    await screens[to].arrive(ep, ctx);
    if (ep === EPOCH) focusHeading(to);
  } catch (e) { reportError(e); }               // toast + RESTART path
  finally { if (ep === EPOCH) lock(false); }
}
```
`show()` unhides the destination, hides the others (after `keepMs` for overlapping exits), and cancels script animations in hidden subtrees. `jump(name)` (test/dev only) increments `EPOCH`, cancels every script animation (CSS ambient loops are kept), clears FX, sets the preconditions, and calls `arrive`.

## 11. Error handling
| Situation | Behavior |
|---|---|
| Unsupported / corrupt file, > 25 MB | toast "The mirror cannot see this. Try another image." ("(too large)"); stay on offering |
| Camera denied / missing | message on the webcam panel; upload stays available |
| Precompute fails (OOM, canvas limit) | PREPARE_ERROR → framing, toast "The mirror clouded over. Try again." |
| `createImageBitmap` / `OffscreenCanvas` / `linear()` / `StereoPanner` missing | fallbacks (img decode / main thread / cubic-bezier / no pan) |
| Download blocked | new tab + "Long-press to save." |
| Uncaught error | global handler: toast "The ritual was interrupted." + BEGIN AGAIN (RESTART). Never log image data |

## 12. Testing strategy
Property tests P1–P15 and e2e flows E1–E10 are listed in qa.md. Pure modules are test-first. Every property was run against this design before implementation (Appendix A).

## 13. Accessibility details
- A visually hidden heading per scene with `tabindex="-1"`, focused after each transition (`:focus { outline: none }` for programmatic focus only).
- Real `<button>`s. Size cards are `role="radio"` with roving tabindex and arrow keys.
- Portrait canvases have `role="img"` with live labels, e.g. "Your portrait, 12 of 36 original parts remaining".
- Animated text exposes its full text via `aria-label`. The letter spans are `aria-hidden`.

## 14. Deployment
`.github/workflows/deploy.yml`: on push to `main` → `npm ci` → `npm run lint` → `npm test` → `npx playwright install --with-deps chromium webkit` → `npm run test:e2e` → `npm run build` → deploy `dist` to GitHub Pages. Include `og:` meta tags and `public/og-image.png`.

---

## Appendix A — Pre-build verification (run before any app code existed)
Every algorithm in v1 of this design was implemented in a throw-away harness and tested with fast-check, and the motion system was prototyped in a browser and driven by headless Chrome (Playwright).

| # | Check | v1 result | v2 fix |
|---|---|---|---|
| 1 | Endings: 2–4 sentences each | ❌ "Nobody in the Mirror" had 5 | merged the first two sentences |
| 2 | FSM: every state can exit | ❌ 7 states had no RESTART; `preparing` had no error path | global RESTART + PREPARE_ERROR + offering BACK |
| 3 | Springs settle under random frame drops | ❌ never settled for tiny travels (relative-only rest threshold vs floating point) | absolute floors 0.001 / 0.01 |
| 4 | Spring tests themselves | ❌ fast-check shrinking hung on a non-terminating case | finite 10 s simulated budget + `endOnFailure` |
| 5 | Ghost effects keep darks dark | ❌ Negative effect turned dark backgrounds white (a "checkerboard" look) | darkened formula (P15) |
| 6 | Portrait/text overlap on verdict and restore | ❌ layout measured before the text existed | measure after content + ResizeObserver relayout + drift test |
| 7 | Canvas readbacks | ⚠️ Chrome `willReadFrequently` warning (2 readbacks) | single readback, keep the array |
| 8 | Auto mode length | ⚠️ 1.2 s fixed → 43 s for 6×6 (too long for a demo) | crescendo: 11.0 / 15.1 / 20.2 s |
| 9 | Effect variety threshold | ✅ met the v1 limit of 30% (max measured 16.7%) | tightened to < 20% |
| 10 | Grid tiling, replacement permutation, reassembly bounds, determinism | ✅ | — |
| 11 | Director model (one screen, latest target, no interaction mid-transition) | ✅ 1000 random op sequences | — |
| 12 | Prototype e2e (desktop, mobile 390×844 and 375×667, reduced motion, all 8 endings, rapid clicking, jump spam) | ✅ 0 console errors, 0 network requests, drift ≤ 2 px | — |

## Appendix B — Motion prototype
A single-file browser prototype (`motion-prototype.html`, delivered outside this repo) demonstrates T1–T8 and M1–M15 with a painted demo portrait. It is a **visual reference only**: watch it, slow it down with its ¼× speed control, and compare. The app itself is built from this spec in Kiro. Do not copy the prototype's code into the project.
