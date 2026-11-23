---
inclusion: fileMatch
fileMatchPattern: "tests/**"
---

# QA Steering — tests, matrix, definition of done

## Conventions
- Unit and property tests: Vitest + fast-check, in `tests/core` and `tests/motion`. Use `{ endOnFailure: true }` on expensive properties so shrinking can never hang. Give simulations a finite budget (e.g. 10 s simulated time).
- e2e: Playwright (Chromium + WebKit), in `tests/e2e`. Always load with `?test=1&seed=42&speed=4&sound=0` unless the test is about speed or sound. Use the built-in fixture portrait (no uploads), except in E3.
- Every e2e test listens for `console` errors/warnings, `pageerror`, and any request not starting with the app origin, `data:` or `blob:`. Any hit fails the test.
- Wait for state, not time: poll `window.__app.scene` and `window.__app.busy`.
- Fix the code, not the test, unless the test contradicts the spec.

## Property tests (all must pass before deploy)
| ID | Property | Req |
|---|---|---|
| P1 | For any seed and N ∈ {4,6,8}, the replacement order is a permutation of 0..N²−1 | R6.6 |
| P2 | The same seed + N gives an identical order, effects and reassembly map | R15.1 |
| P3 | For size ∈ [64, 2048], grid rects tile the square exactly: area sum = size², shared edges, all sizes > 0 | R4.4 |
| P4 | Over seeds 0..500 and every N, the same-effect adjacent ratio is < 20% | R5.2 |
| P5 | The reassembly map is a permutation; displaced pieces are at Manhattan distance 1 from home; 2 ≤ displaced ≤ ceil(0.2·N²) | R8.2 |
| P6 | Random event sequences keep the FSM in a valid state; invalid events change nothing | R17 |
| P7 | Every state ≠ landing has RESTART → landing; preparing has PREPARE_ERROR → framing; offering has BACK → landing | R17.3–4 |
| P8 | All 8 endings exist: title ≤ 5 words, body 2–4 sentences, ≤ 220 chars | R9.1 |
| P9 | `restoreOrder(restoreOrder(o)) = o`, same elements | R11.1 |
| P10 | Effects never mutate their input and keep the dimensions | R5.4 |
| P11 | Springs (every preset, any from/to in ±500, frame dts in [1/240, 0.5] s) settle exactly on the target within 10 s simulated, never NaN | R16.2 |
| P12 | Spring overshoot at 30/60/120 fps differs by < 1 percentage point | R16.2 |
| P13 | Director model, random ops (setTarget/tick/skip): never 2 screens mounted, interactive only when idle on target, converges to the latest target | R16.6, R17.1 |
| P14 | Auto intervals never increase and are ≥ 0.18 s; totals 4×4 < 12 s, 6×6 < 18 s, 8×8 < 24 s | R6.3 |
| P15 | An all-dark input (channels < 40) gives luminance < 140 for every effect | R5.5 |

## e2e flows
| ID | Flow | Asserts |
|---|---|---|
| E1 | Happy path, desktop 1280×800: landing → offering → framing (6×6) → ritual (3 manual + auto) → question → ship → verdict | scenes reached in order; counter text correct after manual swaps; drift ≤ 2 px in every portrait scene |
| E2 | All 8 endings via `jump('question')` + answers | `#end-title` aria-label matches design.md §6; only no/neither has the wound class |
| E3 | Upload a real JPEG/PNG (fixtures/portrait.jpg, rotated-exif.jpg, transparent.png, not-an-image.txt, huge.jpg) | correct orientation; transparency filled; error toasts for bad files; still on offering after errors |
| E4 | Rapid input: double-click BEGIN, triple-click an answer, mash R during transitions, press A during the snuff | exactly one transition each; no errors; final scene correct |
| E5 | Jump spam: 7 jumps 120 ms apart | ends idle on the last jump target; no errors |
| E6 | Reduced motion (`reducedMotion: 'reduce'`): full flow + 36 manual replacements | completes; ending correct |
| E7 | Mobile 390×844 and 375×667 (hasTouch): every scene | no horizontal overflow; drift ≤ 2 px; all buttons inside the viewport |
| E8 | Restore → Begin again → second run | counter back to N²/N²; memory released (no leftover canvases > 0×0 except active); new seed unless fixed |
| E9 | Leave: Escape in ritual → dialog → Stay (nothing changes), Leave → landing | auto stopped; no stale callbacks after leaving (wait 3 s, scene stays landing) |
| E10 | Offline: after load, set the context offline and run E1 at speed 4 | completes; zero requests |

## Manual QA matrix (before submitting)
| Device / browser | Must check |
|---|---|
| Chrome desktop | full flow, ¼-speed visual check of T1–T8, sound on/off |
| Safari macOS | linear() easings, clip-path ink drop, audio unlock |
| iPhone Safari (iOS 17+) | webcam, HEIC upload, 100dvh, safe areas, haptics absent but no errors, audio after tap |
| Android Chrome | webcam, vibration, performance during auto at 8×8 |
| Keyboard only | Tab order, Enter/Space on everything, arrows on size cards, R/A/M/Escape |
| Screen reader (VoiceOver) | headings announced, counter every 5, answers labelled |
| Slow device (CPU 4× throttle) | no freezes > 100 ms during precompute; swaps still smooth |

## Definition of done (per task)
1. `npm test` and `npm run test:e2e` are green. 2. No console errors or warnings in the flows touched. 3. Works at 390 px and 1280 px. 4. Reduced motion is still completable. 5. Strings come from i18n, colors from tokens, easings from easings.ts.
