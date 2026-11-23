# Requirements Document — "Am I Still Me?" (v2)

## Introduction
"Am I Still Me?" is a single-page, fully client-side web app for the Kiroween 2026 hackathon (Costume Contest category). The user offers a face photo. The app replaces it piece by piece with "ghost" pieces, then confronts the user with the Ship of Theseus paradox in two questions. It ends with one of 8 poetic endings and a downloadable certificate.
Steering files (`product.md`, `tech.md`, `structure.md`, `design-system.md`, `motion.md`, `qa.md`) apply to every requirement. v2 adds motion (R16), robustness (R17) and testability (R18), and includes fixes found by verifying the v1 design before any code was written (design.md Appendix A).

## Glossary
- **Portrait**: the square, downscaled (≤ 1024 px) version of the user's image.
- **Grid size N**: the portrait is divided into N×N pieces, N ∈ {4, 6, 8}.
- **Original / ghost piece**: a piece showing original pixels / one transformed by a ghost effect.
- **Replacement order**: a permutation of all piece indices.
- **Reassembled portrait**: a portrait built only from original pieces, in a slightly shuffled arrangement.
- **Answer 1**: yes / no. **Answer 2**: ghost / reassembled / neither / both.
- **Transition Tn / micro-interaction Mn**: as defined in motion.md.
- **Busy**: the input-locked state during a transition.

---

### Requirement 1 — Landing screen
**User story:** As a visitor, I want an atmospheric first screen that explains the idea in one line, so that I want to start.
1. WHEN the app loads THEN the system SHALL show the eyebrow "A HAUNTED MIRROR", the title "Am I Still Me?", the subtitle "If every part of you were replaced, would you still be you?", a "BEGIN THE RITUAL" button with a pulse ring, and the privacy line "Your face never leaves this device."
2. WHEN the landing screen appears THEN the system SHALL play its entrance: title letters drop (M4, stagger 48 ms) followed by the "?" wobble, then the subtitle, button and privacy line.
3. WHEN the user activates BEGIN (click, tap, Enter or Space) THEN the system SHALL unlock audio and run transition T1 (Ink Drop) from the activation point to the Offering screen.
4. IF reduced motion is active THEN the system SHALL apply the reduced-motion mapping (motion.md §10).

### Requirement 2 — Image input (upload)
**User story:** As a user, I want to offer a photo from my device, so that the ritual uses my own face.
1. WHEN the user chooses "Offer a photograph" THEN the system SHALL open a file picker accepting JPEG, PNG, WebP, and HEIC where decodable.
2. WHEN an image file is dragged over the drop zone THEN the system SHALL highlight it, and WHEN dropped THEN the system SHALL load it.
3. WHEN an image loads THEN the system SHALL respect EXIF orientation, fill transparency with `--void`, center-crop it to a square, and downscale it to at most 1024 px.
4. IF the file is not an image, cannot be decoded, or is larger than 25 MB THEN the system SHALL show the toast "The mirror cannot see this. Try another image." (adding "(too large)" for size) and stay on Offering.
5. WHEN the image is accepted THEN the system SHALL run transition T2 (Offering Lands).
6. The system SHALL NOT send the image over the network or store it anywhere.

### Requirement 3 — Image input (webcam)
**User story:** As a user, I want to take a photo with my webcam, so that I can start right away.
1. WHEN the user chooses "Look into the mirror" THEN the system SHALL request camera permission and show a mirrored live preview in a square frame.
2. WHEN the user activates CAPTURE THEN the system SHALL capture after a 3-2-1 countdown (each number pops in with `pop`), un-mirror the frame, and continue with T2.
3. WHEN capture finishes OR the user leaves the screen THEN the system SHALL stop all camera tracks.
4. IF permission is denied or no camera exists THEN the system SHALL show "The mirror is covered. Offer a photograph instead." and keep upload available.

### Requirement 4 — Framing and grid choice
**User story:** As a user, I want to adjust the framing and choose the number of pieces, so that my face is centered and I control the ritual's length.
1. WHEN an image is ready THEN the system SHALL show it in the framing slot, repositionable by drag or arrow keys, and zoomable 100–200% by wheel, pinch or slider.
2. The system SHALL offer a radiogroup: 4×4 "A Whisper", 6×6 "A Haunting" (default), 8×8 "A Possession". Arrow keys change the selection (M7).
3. WHEN the grid size changes THEN the system SHALL re-slice the faint grid preview on the portrait (M7).
4. WHEN the user activates BEGIN THEN the system SHALL produce the final portrait, build the grid with integer edges, precompute the 5 ghost effect images in chunks (no main-thread block > 100 ms), and run T3 (Shatter-In).
5. IF precomputation fails THEN the system SHALL return to Framing with the toast "The mirror clouded over. Try again." (FSM event PREPARE_ERROR).

### Requirement 5 — Ghost effects
**User story:** As a user, I want replaced pieces to look ghostly but recognizable, so that the change feels uncanny, not random.
1. The system SHALL provide five effects: Spectral, Glitch, Negative Blur, Static, Echo, with the exact formulas in design.md §5.
2. WHEN the grid is built THEN the system SHALL assign effects with the seeded RNG so that **fewer than 20%** of adjacent piece pairs share an effect. (Measured: max 16.7% at 4×4 over 5000 seeds, mean ≈ 0.9%.)
3. Every ghost piece SHALL have the faint inner edge glow (design-system.md signature 6).
4. Each effect SHALL be a pure function `(pixels, w, h, rng) → newPixels` that never mutates its input.
5. Effects SHALL keep dark regions dark: for an all-dark input (every channel < 40), every output pixel's luminance SHALL be < 140. (v1's negative effect turned dark backgrounds into bright white blocks. Fixed in v2.)

### Requirement 6 — Replacement ritual
**User story:** As a user, I want to replace pieces one by one and watch what remains of me, so that I feel the slow loss of the original.
1. WHEN the Ritual screen opens THEN the system SHALL show the counter "ORIGINAL PARTS REMAINING N² / N²", the portrait, the progress line, and the controls REPLACE A PIECE, AUTO and SOUND.
2. WHEN the user activates REPLACE A PIECE (or presses R) THEN the system SHALL replace the next piece in the replacement order using the tile swap M13, update the odometer (M9) and progress line (M10), and show a log line.
3. WHILE AUTO is on (toggle or A key) THEN the system SHALL replace pieces on the crescendo schedule `max(0.18 s, 1.2 s·0.92^i)` (motion.md §8), switching to the fast swap after 8 auto replacements.
4. The log line SHALL show "Piece k · row r, column c · replaced." except every 4th replacement, which shows a line from the poetic pool, never the same line twice in a row.
5. WHEN the counter reaches 0 THEN the system SHALL stop auto, lock input, wait 1.5 s, and run T4 (Candle Snuff).
6. The replacement order SHALL be a permutation: every piece is replaced exactly once.
7. WHILE idle for 5 s with auto off THEN the system SHALL wiggle the REPLACE button (M11).
8. WHERE supported THEN the system SHALL vibrate 8 ms per replacement (M12), except in reduced motion.

### Requirement 7 — The First Question
1. WHEN T4 runs THEN the system SHALL dim the fully ghosted portrait to 28%, close the shade around it, shake the screen, toll, puff smoke, and drop in the text "Every part of you has been replaced. Are you still you?"
2. The system SHALL show YES and NO only after the letters have landed.
3. WHEN the user answers THEN the system SHALL store Answer 1 and run T5 (The Split).

### Requirement 8 — The Second Ship (twist)
1. WHEN T5 runs THEN the system SHALL show "But the mirror kept every piece it took." and fly every original piece from the ghost portrait into a second portrait (fly-back, motion.md §6).
2. The reassembled portrait SHALL use every original piece exactly once, with `2·ceil(max(2, round(0.15·N²))/2)` pieces displaced (4×4: 2, 6×6: 6, 8×8: 10), each swapped only with an orthogonally adjacent piece.
3. WHEN all pieces have landed THEN the system SHALL pop in the captions "THE GHOST" / "THE REASSEMBLED", drop in "Which one is you?", and pop in four answers: THE GHOST, THE REASSEMBLED, NEITHER, BOTH.
4. WHEN the user answers THEN the system SHALL store Answer 2 and run T6 (Fog Swallow).
5. Below 720 px wide the portraits SHALL stack vertically, and the whole screen SHALL fit without scrolling at 375×667.

### Requirement 9 — Verdict and endings
1. The system SHALL contain exactly the 8 endings in design.md §6 (title ≤ 5 words, body 2–4 sentences, ≤ 220 characters).
2. WHEN the Verdict appears THEN the system SHALL show: the ghost portrait (ghost), the reassembled portrait (reassembled), an empty fog frame (neither), or both portraits stacked with the reassembled one at 50% opacity (both). The shown portrait(s) float (bob).
3. Only "Nobody in the Mirror" SHALL use the `--wound` accent.
4. The system SHALL show DOWNLOAD CERTIFICATE, RESTORE ME and BEGIN AGAIN after the text has appeared, plus the seed in small text.
5. The ending text SHALL be in the DOM **before** the portrait position is measured, so the portrait never overlaps the text. (Bug found in the prototype.)

### Requirement 10 — Certificate download
1. WHEN the user activates DOWNLOAD CERTIFICATE THEN the system SHALL render a 1080×1350 PNG (design-system.md) after `document.fonts.ready` and download it as `am-i-still-me-certificate.png`.
2. IF the download is blocked (in-app browsers) THEN the system SHALL open the image in a new tab and toast "Long-press to save."

### Requirement 11 — Restore and restart
1. WHEN the user activates RESTORE ME THEN the system SHALL run T8, ending with "Restored. But are you the same one who began?" and BEGIN AGAIN.
2. WHEN the user activates BEGIN AGAIN THEN the system SHALL run T7 (Rewind), release all image memory (ImageBitmaps closed, canvases set to 0×0), clear answers, pick a new seed (unless `?seed` is fixed), and show Landing.

### Requirement 12 — Sound
1. The system SHALL synthesize all sounds with Web Audio (no files): drone, whisper (≤ 6 simultaneous voices, panned by column), tick, thud, crack, whoosh, toll, click (design.md §9).
2. The system SHALL NOT play sound before the first user gesture. Sound is on by default after BEGIN and can be muted with the toggle or the M key. The choice persists (localStorage in try/catch).
3. WHEN the tab is hidden THEN the system SHALL suspend the AudioContext, and resume it when visible again if not muted.

### Requirement 13 — Privacy and offline behavior
1. After first load, the system SHALL make zero network requests.
2. The system SHALL NOT write image data to any storage or to the console.
3. The landing screen and README SHALL state that the photo is processed only in the browser.

### Requirement 14 — Accessibility and responsiveness
1. All interactive elements SHALL be keyboard-operable in a logical order, with a visible focus ring. After each transition, focus moves to the scene heading.
2. Text SHALL meet WCAG AA contrast.
3. Counter updates SHALL be announced via `aria-live="polite"` at most every 5 pieces. Animated letters and words SHALL expose their full text via `aria-label`.
4. The layout SHALL work from 360 px to 2560 px wide with no horizontal scroll and no overlap between a portrait and any text (measured drift ≤ 2 px, R17.6).

### Requirement 15 — Reproducibility
1. WHEN the URL contains `?seed=<int>` THEN all seeded randomness (order, effects, reassembly) SHALL be identical for the same image and grid size.
2. Without a seed, the system SHALL generate one and show it on the Verdict screen.

### Requirement 16 — Motion system and transitions
**User story:** As a user, I want the mirror to feel alive (smooth, bouncy, playful) while still elegant.
1. The system SHALL implement the Ticker, the spring solver, and the presets `snappy`, `pop`, `jelly`, `gentle`, `follow` exactly as in motion.md §1. CSS animations SHALL use the generated `linear()` easings, with cubic-bezier fallbacks.
2. Springs SHALL converge exactly to their target under arbitrary frame-time sequences (1/240 s … 0.5 s per frame) without NaN/Infinity, and SHALL be frame-rate independent (overshoot within 1 percentage point at 30/60/120 fps).
3. The system SHALL implement transitions T1–T8 and micro-interactions M1–M15 with the timings in motion.md.
4. Portraits SHALL be shared elements that travel between scenes via FLIP (`gentle`), never re-created mid-flow.
5. Particles SHALL follow motion.md §7 and never exceed 320 at once.
6. At most one scene SHALL be interactive at any time. A scene becomes interactive only when its transition has finished.
7. IF reduced motion is active THEN every transition SHALL complete with the reduced mapping (motion.md §10), and the full flow SHALL remain completable.

### Requirement 17 — Robustness and interaction safety
**User story:** As a user, I want nothing to break no matter how fast or strangely I click.
1. WHILE busy THEN the system SHALL ignore scene clicks and shortcuts. Repeated activation of BEGIN, an answer or BEGIN AGAIN SHALL start at most one transition.
2. Every async choreography SHALL stop silently when the epoch changes (restart, leave, jump). No stale callback may change the current scene.
3. Every state other than landing SHALL accept RESTART → landing (the escape hatch). The "✕ Leave" button (scenes 1–6) and the Escape key SHALL open a confirm dialog: "Leave the mirror? Your reflection will be forgotten." [Stay] [Leave]. (v1 had 7 states without an exit.)
4. The `preparing` state SHALL handle PREPARE_ERROR → framing, and offering SHALL handle BACK → landing.
5. WHEN the tab is hidden mid-animation THEN, when shown again, animations SHALL resume or finish without jumps larger than one 100 ms step (dt clamp), and the scene SHALL stay consistent.
6. WHEN the viewport resizes, rotates, or a scene's content changes size THEN portraits SHALL re-place to their slots (ResizeObserver; `gentle` FLIP; instant on window resize). Measured drift after settling SHALL be ≤ 2 px.
7. WHEN leaving the ritual or restarting THEN the system SHALL stop auto mode, clear particles and flying tiles, and cancel all script animations of hidden scenes.
8. The app SHALL produce no console errors or warnings during any e2e flow. (This includes the Canvas `willReadFrequently` warning: read pixels back once.)

### Requirement 18 — Testability
1. URL parameters: `?seed=<int>`, `?speed=<0.1–10>` (scales all motion and waits), `?rm=1` (forces reduced motion), `?sound=0`.
2. WHEN `?test=1` is present THEN the system SHALL expose `window.__app = { scene, busy, layoutDrift(), jump(name) }` and accept a built-in fixture portrait, so e2e tests need no file upload. Without `?test=1`, nothing is exposed.
3. The repository SHALL contain property tests P1–P15 and e2e flows E1–E10 from qa.md, all passing in CI before deploy.
