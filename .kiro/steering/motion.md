---
inclusion: fileMatch
fileMatchPattern: "src/**"
---

# Motion Steering — springs, transitions, micro-interactions

Personality: **elegant darkness, playful motion**. Things bounce, squash, stretch and wobble as if the mirror were alive, but every curve comes from the four verified spring presets below. No ad-hoc easings.
All numbers were verified by running them: a property-tested spring solver plus a browser prototype checked in headless Chrome (see design.md Appendix A).

## 1. Spring presets (mass = 1)
| Preset | stiffness k | damping c | ζ | Overshoot | Settles (2%) | CSS duration | Use |
|---|---|---|---|---|---|---|---|
| `snappy` | 420 | 27 | 0.66 | 5.5% | 279 ms | 321 ms | hover, press, lift, small UI |
| `pop` | 256 | 16 | 0.50 | 15.6% | 487 ms | 558 ms | elements appearing, buttons, flip-in |
| `jelly` | 380 | 11 | 0.28 | 39.3% | 692 ms | 883 ms | squash recovery, wobble, landing, shatter |
| `gentle` | 70 | 13 | 0.78 | 1.8% | 429 ms | 850 ms | large moves: portraits (FLIP), shade, mist, words |
| `follow` | 140 | 24 | ≈1.0 | 0% | — | — | cursor glow, card tilt (critically damped) |

Solver: semi-implicit Euler, fixed 1/240 s substeps, frame dt clamped to 100 ms. Rest when `|x−target| < max(0.0005·travel, 0.001)` and `|v| < max(0.005·travel, 0.01)`, then snap to the target exactly. `travel = max(|target − x|, |v₀|/√k)`. A `kick(v)` adds velocity while the target stays put (used for impulses).

## 2. CSS easings (generated from the presets: 29 samples, cut at ±0.5% settle)
```css
--ease-snappy: linear(0, 0.04, 0.124, 0.196, 0.314, 0.437, 0.556, 0.63, 0.73, 0.816, 0.887, 0.926, 0.972, 1.007, 1.03, 1.041, 1.051, 1.055, 1.054, 1.052, 1.047, 1.041, 1.035, 1.03, 1.024, 1.018, 1.013, 1.01, 1);  /* 321ms */
--ease-pop:    linear(0, 0.06, 0.194, 0.33, 0.512, 0.689, 0.844, 0.946, 1.044, 1.11, 1.145, 1.156, 1.152, 1.134, 1.109, 1.081, 1.053, 1.033, 1.011, 0.995, 0.984, 0.979, 0.976, 0.976, 0.978, 0.982, 0.986, 0.99, 1);  /* 558ms */
--ease-jelly:  linear(0, 0.206, 0.567, 0.995, 1.264, 1.39, 1.355, 1.211, 1.038, 0.919, 0.852, 0.853, 0.902, 0.961, 1.021, 1.055, 1.06, 1.044, 1.022, 0.997, 0.982, 0.976, 0.981, 0.989, 0.999, 1.006, 1.009, 1.009, 1);  /* 883ms */
--ease-gentle: linear(0, 0.03, 0.112, 0.207, 0.311, 0.416, 0.531, 0.622, 0.703, 0.782, 0.839, 0.886, 0.923, 0.956, 0.977, 0.993, 1.005, 1.012, 1.016, 1.018, 1.018, 1.017, 1.016, 1.014, 1.012, 1.01, 1.008, 1.006, 1);  /* 850ms */
```
Fallbacks (no `linear()` support): snappy `cubic-bezier(.3,1.3,.5,1)`, pop `cubic-bezier(.34,1.56,.64,1)`, jelly `cubic-bezier(.4,2,.4,.75)`, gentle `cubic-bezier(.22,.8,.3,1)`.
Utility easings: `in` `cubic-bezier(.55,0,.75,.2)` (gravity, exits), `out` `cubic-bezier(.16,.84,.3,1)`, `inOut` `cubic-bezier(.65,0,.35,1)` (ink drop).
⚠️ Never use `jelly` for large travel (e.g. a drop from off-screen): 39% overshoot overshoots far past the target. Fall with `in`, then **squash on landing** with jelly.

## 3. Choreography rules
1. **Input lock**: while a transition runs, `body.is-busy` disables pointer events on scenes, and shortcuts check the busy flag. Unlock when the destination's last interactive element has appeared.
2. **Epoch token**: every sequence captures `ep = EPOCH` and checks it after each `await`. Restart, jump and leave increment `EPOCH`.
3. **Shared elements**: portraits never get re-created between scenes. They travel (FLIP, `gentle`) from slot to slot (design.md §7).
4. **Overlap**: a destination's entrance may start before the origin's exit finishes (ink drop starts at +110 ms). Keep the origin visible for its exit duration, then hide it and cancel its animations.
5. **Stagger** small groups at 40–130 ms and letters at 22–48 ms. Never stagger more than ~1.5 s in total.
6. **Sound sync**: whisper at the flip midpoint, tick at landings, toll at the snuff, whoosh on big transitions, thud on the drop landing, crack on the shatter.

## 4. Scene transitions (T0–T8)
| ID | From → To | Choreography |
|---|---|---|
| T0 | default / Back | origin elements `outDown` (opacity→0, y+16 px, scale .96, 300 ms `out`, stagger 40 ms) → destination entrance |
| T1 **Ink Drop** | landing → offering | Origin = pointer position on BEGIN (button center for keyboard). Ring: 2 px `--ghost` border + 34 px glow, diameter 0 → 2·Rmax+60 (Rmax = distance to the farthest corner), 1050 ms `inOut`, opacity 0→1 (8%)→0.9 (62%)→0. Incoming scene: `clip-path: circle(0 → Rmax+30 at origin)`, 1050 ms `inOut`. Landing fades + scales to .94 over 750 ms, hidden at 800 ms. Destination entrance begins at +110 ms. Whoosh. |
| T2 **Offering Lands** | offering → framing | Other elements `outDown`. Chosen card: scale 1→1.06 (30%)→0.5, y −40 px, opacity→0, 380 ms `in`. At 340 ms the portrait falls: `translateY(−78vh) rotate(−9°) scale(.92)` → none, 520 ms `in`, delay 60 ms. On land: squash `scale(1.14,.84)`→1 with jelly (origin bottom center), 28 dust particles along the bottom edge, thud, 4 px / 260 ms shake. Title letters (stagger 26), size cards pop (700 + i·90 ms), BEGIN pops (1000 ms), grid preview fades in (`gentle`, 950 ms). |
| T3 **Shatter-In** | framing → ritual | Framing UI `outDown` (stagger 45). Portrait FLIPs to the ritual slot (`gentle`). Counter `dropIn` (250 ms), progress line scaleX 0→1 (`gentle`, 320 ms), controls pop (760 + i·90 ms). At +500 ms the **crack**: grid lines flash (3 px, glow, alpha 1→0 over 560 ms easeOutCubic). Every tile gets an outward velocity kick of 700–1120 canvas-units/s (1024 space) with `jelly`, rotation kick ±2.5 rad/s, scale kick −1.2…−2.2 /s, each delayed by distanceFromCenter·38 ms. Portrait wobble kick −0.9, 30 sparks, crack sound. |
| T4 **Candle Snuff** | ritual → question | Auto stops. Ritual UI `outDown` (stagger 40, 420 ms). Portrait FLIPs to the question slot. Canvas opacity 1→0.28 (1300 ms `gentle`). Shade (a radial darkness centered on the portrait) scale 2.4→1, opacity 0→1 (1400 ms `gentle`). Screen shake 7 px over 480 ms (10 decaying steps). Toll. Three smoke puffs at 0/180/380 ms from the portrait's upper fifth. Question letters drop at 700 ms (stagger 24). YES/NO pop after the letters (+150 ms, stagger 110). |
| T5 **The Split** | question → ship | Question letters fly up and fade (240 ms `in`, stagger 7). Answers shrink out. Shade expands away (scale 1→1.8, fade, 900 ms). Canvas opacity → 1. Portrait A FLIPs to slot A. Portrait B pops in at slot B (scale .4, rotate −6° → none, `pop`, delay 380 ms) with dashed empty cells. Intro letters drop (stagger 22). At +1200 ms the **fly-back** (§6). Then captions pop (stagger 120), question letters drop (stagger 30), 4 answers pop (stagger 90). |
| T6 **Fog Swallow** | ship → verdict | Ship UI fades (300 ms, stagger 30). Mist wall opacity 0→1, scale 1.15→1 (800 ms `gentle`). Whoosh. At +720 ms the verdict is laid out under the mist, then the mist lifts: opacity 1→0, scale 1→1.12 (1300 ms `gentle`). Chosen portrait(s) start floating. Title letters drop (delay 500, stagger 34). Body words float in (stagger 40). Actions pop (stagger 100). Seed line fades in. |
| T7 **Rewind** | verdict → landing | Title, body, actions, seed: scale 1→1.06 (25%)→0 + rotate 8°, opacity→0, 440 ms `in`, stagger 45. Portraits the same with rotate −10°, 480 ms. Whoosh. Then the landing entrance. |
| T8 **Restore** | verdict → ritual (restore mode) | Verdict UI `outDown`. Portrait A FLIPs to the ritual slot (B and E fade out). Controls hidden. Log "The mirror gives back what it took…". After 900 ms, flip every piece back in **reverse** replacement order using the fast swap, interval `max(70 ms, 380·0.9^j)`, counter rising, sparks on every 3rd. +700 ms: "Restored. But are you the same one who began?" (letters) + BEGIN AGAIN pops. |

## 5. Micro-interactions (M1–M15)
| ID | What | Spec |
|---|---|---|
| M1 | Button hover | CSS `translate: 0 -2px` (snappy), border `--ghost`, glow, text glow |
| M2 | Button press | pointerdown → `scale(1.06,.88)` 130 ms `out`; release → none with `jelly`. Enter/Space: same with a 90 ms hold |
| M3 | Pulse ring | BEGIN only: box-shadow 0 → 16 px, fade, 2.8 s loop |
| M4 | Letter drop | per letter `translateY(-.7em) rotate(±13°) scale(.6)` → none, `pop`, stagger 22–48 ms. After the hero title lands, the "?" wobbles (rotate −16° → 11° → −4° → 0, 760 ms) |
| M5 | Word float | `translateY(12px) blur(6px)` → none, `gentle`, stagger 40 ms |
| M6 | Card tilt | rotateX ±7°, rotateY ±8° toward the pointer (`follow`). On leave, return with `jelly`. Mouse only |
| M7 | Size select | the chosen card goes `scale(.88)` → none (`jelly`). The grid preview re-slices: alpha 0 → .9 (`pop`) + portrait wobble |
| M8 | Toggle knob | translateX 16 px with `--ease-jelly` |
| M9 | Odometer | old number slides up and fades (260 ms `out`); the new one slides in from below (`pop`). They overlap in one grid cell |
| M10 | Progress | scaleX transition with `--ease-pop` |
| M11 | Idle hint | ritual, auto off, 5 s without a replacement → REPLACE wiggles (rotate −5°/4°/−2°/0, scale 1.05, 680 ms) |
| M12 | Haptics | `navigator.vibrate(8)` per replacement where supported. Never in reduced motion |
| M13 | **Tile swap** | **Lift**: scale→1.17, rot ±0.06 rad (sign by column side), z-top, drop shadow (blur 36, y 14), `snappy`. **Flip** after 110 ms: scaleX 1→0 (105 ms easeInQuad) → swap face → scaleX 0→1 (`pop`). Whisper panned by column (−0.6…0.6) + 9 sparks. **Land** after 60 ms: scale→1, rot→0 (`jelly`), portrait wobble kick −0.55. z reset after 650 ms. **Fast variant** (auto after 8 pieces, and restore): 60/70/30 ms, 5 sparks, wobble −0.3 |
| M14 | Candle cursor | position follows the pointer (`follow`). Flicker scale `1 + 0.035·sin(13.1t) + 0.02·sin(29.7t+1.3)` |
| M15 | Toast | in from y+16 px, scale .96 (`pop`). Auto-hide after 3.4 s with a 300 ms fade |

## 6. The fly-back (second ship)
- For each piece `p` in replacement order: a flying copy of the **original** tile starts at A's tile center and ends at B's slot `inv[p]` (where `map[slot] = p`).
- Path: quadratic Bézier. Control point x = midpoint ± 35 px (random). Control point y = `min(y0, y1) − min(240, 0.42·distance) − 20`, so tiles leap up, then land.
- Duration 620 ms easeInOutCubic. Size lerps from A's to B's tile size, with a 22% mid-flight bulge (`1 + 0.22·sin(πt)`). Rotation `0.35·sin(πt)` toward the travel direction. Cyan glow `shadowBlur = 18·sin(πt)`.
- Stagger = `clamp(1500 / N², 20, 70)` ms (4×4: 70 ms, 6×6: 42 ms, 8×8: 23 ms).
- **On land**: B's tile face becomes original. Squash: `sy` set .72 → spring 1 (`jelly`), scale 1.12 → 1 (`jelly`). B wobble −0.22, tick sound, 3 dust particles.

## 7. Particles
| Type | Sprite | Motion | Life | Blend |
|---|---|---|---|---|
| spark | cyan radial r16 | vx ±35, vy −50…−160 px/s, sine drift ±22 px/s, vy damping 0.8/s | 0.7–1.5 s | `lighter`, alpha 1→0 |
| dust | bone radial r12 | vx ±85, vy −40…−140, gravity 260 px/s² | 0.45–0.95 s | `lighter`, alpha 0.8→0 |
| smoke | grey radial r48 | vy −22…−52, sway ±10 px/s, grows 16 px/s | 2.2–3.8 s | normal, alpha `0.45·sin(πk)` |
Cap 320 (drop the oldest first). No particles in reduced motion.

## 8. Auto-mode crescendo
`interval(i) = max(0.18 s, 1.2 s · 0.92^i)`. Totals: 4×4 11.0 s · 6×6 15.1 s · 8×8 20.2 s (property-tested: never increasing, never below 0.18 s). The first auto replacement fires at 0.6 × interval(0). Use the fast swap after 8 auto replacements.

## 9. Ambient loops
Fog (20 fps), grain (CSS steps), breathing frame glow (6 s), BEGIN pulse (2.8 s), verdict portrait bob (`translateY(-5px…6px) rotate(-.5°….6°)`, 3.4 s ease-in-out), candle flicker, drone. All of these pause or stop in reduced motion, and pause when the tab is hidden.

## 10. Reduced motion mapping (`prefers-reduced-motion: reduce`, or `?rm=1`)
| Normal | Reduced |
|---|---|
| any transform animation | 200 ms opacity fade only (or instant when no opacity change) |
| springs | snap to the target instantly |
| letter drop / word float | the whole element fades in |
| tile swap | face swaps, alpha .35 → 1 (`gentle`, snapped → a short fade) |
| ink drop, shatter, shake, smoke, sparks, dust, fly-back arcs | none (fly-back lands all tiles instantly) |
| fog drift, grain jitter, breathing, bob, pulse, candle | static / hidden |
| scene waits | capped at 220 ms |
