# Implementation Plan — "Am I Still Me?" (v2)

Work top to bottom, one task per Kiro run. After every task: `npm test` is green, `npm run dev` works, commit. `(R…)` = requirements.md, `(P…/E…)` = qa.md, `(T…/M…)` = motion.md.

## Phase 0 — Foundation
- [ ] 1. Scaffold Vite + TypeScript (strict), ESLint, Prettier, Vitest, fast-check, Playwright, `@fontsource/cormorant-garamond`, `@fontsource/inter`. Create the folder structure from structure.md. Scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`.
- [ ] 2. `styles/tokens.css` + `base.css`: every color, type, spacing and layer token (design-system.md), plus the motion tokens with the exact `linear()` easings and durations (motion.md §2). Add `[hidden]{display:none!important}`, `100dvh`, safe areas, focus ring, and the reduced-motion overrides.
- [ ] 3. GitHub Actions deploy to Pages (lint → test → e2e → build → deploy) with a placeholder page, so the live link exists from day 1. (design §14)

## Phase 1 — Pure core, test-first
- [ ] 4. `core/rng.ts` + tests (determinism, [0,1), shuffle is a non-mutating permutation). (P2, R15)
- [ ] 5. `core/grid.ts` (integer edges, neighbors, adjacent pairs) + P3.
- [ ] 6. `core/replacement.ts`: order, restore order, effect assignment, reassembly map + inverse + P1, P4, P5, P9. (R5.2, R6.6, R8.2)
- [ ] 7. `core/schedule.ts` auto crescendo + P14.
- [ ] 8. `core/state.ts` FSM v2 + SessionData reducer + P6, P7. (R17.3–4)
- [ ] 9. `core/endings.ts` (8 endings, poetic pool + no-repeat picker) + P8. `core/i18n.ts` with every UI string.
- [ ] 10. `motion/spring.ts` (Spring, Prop with tween) + P11, P12. `core/director-model.ts` + P13.

## Phase 2 — Motion engine
- [ ] 11. `motion/ticker.ts` (single rAF, dt clamp 0.1 s, speed, auto-stop) and `motion/easings.ts` (PRESETS, CSS strings, fallbacks, `linear()` support detection).
- [ ] 12. `motion/animate.ts`: `anim/enter/leave` with the reduced-motion mapping, `playbackRate = speed`, cancellation-safe promises. Keyframe library (fadeUp, popIn, dropIn, cardIn, outDown, outShrink…).
- [ ] 13. `motion/text.ts`: dropLetters (M4, incl. the "?" wobble helper), floatWords (M5), lettersOut. Accessible labels.
- [ ] 14. `motion/micro.ts`: squishy (M2), tilt (M6), wiggle (M11), shake, toast (M15). CSS for the BEGIN pulse ring (M3), button hover (M1) and toggle knob (M8).

## Phase 3 — Atmosphere and shell
- [ ] 15. `render/atmosphere.ts`: fog, grain, candle (M14) + vignette. Pause when hidden. Static in reduced motion.
- [ ] 16. `ui/portraits.ts`: portrait layer (A, B, E wrappers with breathing frame), `place()` FLIP, `layoutFor()`, ResizeObserver relayout with `layoutLocked`, `layoutDrift()`. (R16.4, R17.6)
- [ ] 17. `ui/scenes.ts`: `go/jump/show`, input lock (`body.is-busy`), epoch tokens, KEEP overlap, focus management (R14.1), global error handler → RESTART. (R16.6, R17.1–2)
- [ ] 18. Leave button + confirm dialog + Escape key (R17.3). `?test=1` hooks + fixture portrait (R18.2).

## Phase 4 — Landing and offering
- [ ] 19. Landing screen + entrance (R1) + T1 Ink Drop (ring, clip-path reveal, overlap).
- [ ] 20. `render/image.ts` + upload card + drag-and-drop + validation toasts (R2) + E3 fixtures.
- [ ] 21. Webcam panel (R3): mirrored preview, 3-2-1 pop countdown, capture, track cleanup, denial message.

## Phase 5 — Framing
- [ ] 22. Framing screen: pan/zoom, size radiogroup (M7, arrows), grid preview. (R4.1–3)
- [ ] 23. T2 Offering Lands: gravity drop + jelly squash + dust + thud + shake.

## Phase 6 — Ghosts and the portrait renderer
- [ ] 24. `render/effects.ts` v2 formulas + P10, P15. (R5)
- [ ] 25. `render/precompute.ts`: chunked passes (≤ 100 ms per chunk), glow tile, overlay, PREPARE_ERROR path. (R4.4–5)
- [ ] 26. `render/portrait-view.ts`: tiles with Props, z-sorted drawing, fast path, wobble, flash, grid preview, empty-cell outlines, `tileScreen()`.
- [ ] 27. `render/fx.ts`: spark/dust/smoke particles (cap 320) + flying tiles with promises.

## Phase 7 — The ritual
- [ ] 28. Ritual screen + T3 Shatter-In (crack flash, velocity kicks by distance, sparks, crack sound).
- [ ] 29. Tile swap M13 (lift → flip → land, fast variant), odometer M9, progress M10, log line, live region. (R6.2, R6.4)
- [ ] 30. Auto crescendo (R6.3), idle wiggle M11, haptics M12, shortcuts R/A, completion → 1.5 s lock → T4.

## Phase 8 — The paradox
- [ ] 31. Question screen + T4 Candle Snuff (dim, shade, shake, toll, smoke, letters, answers). (R7)
- [ ] 32. Second Ship + T5 The Split + fly-back (motion.md §6) + captions + 2×2 answers + stacked mobile layout. (R8)
- [ ] 33. Verdict + T6 Fog Swallow + endings (text in DOM **before** layout), bob, wound accent, seed line. (R9, R15.2)

## Phase 9 — Keepsake and replay
- [ ] 34. Certificate PNG + download fallback. (R10)
- [ ] 35. T8 Restore and T7 Rewind + memory release on restart. (R11)

## Phase 10 — Sound
- [ ] 36. `audio/sound.ts` voices (design §9), unlock on BEGIN, mute toggle + M key + persistence, suspend when hidden, wired to every cue in motion.md §3.6. (R12)

## Phase 11 — Test and QA
- [ ] 37. e2e E1, E2, E4, E5 (desktop) with console/network guards and drift checks.
- [ ] 38. e2e E6 (reduced motion), E7 (mobile sizes), E8 (restart/memory), E9 (leave), E10 (offline). (R13, R14, R16.7)
- [ ] 39. Manual QA matrix (qa.md) on real devices. Fix everything found.

## Phase 12 — Polish and submission
- [ ] 40. Visual polish pass: compare every scene at ¼ speed against motion.md and the reference prototype; spacing on the 8 px grid; text balance; contrast.
- [ ] 41. Favicon + OG image (hand-designed), `<title>`, meta tags, README (pitch, GIF, live link, "How I used Kiro", privacy, MIT license).
- [ ] 42. Demo video (< 3 min, recorded with `?seed=42`), Devpost write-up, submit.

## Stretch (only if everything above is done before Dec 2)
- [ ] S1. EN / 日本語 / 한국어 toggle.
- [ ] S2. 1200×630 share card.
