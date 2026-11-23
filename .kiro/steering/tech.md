# Tech Steering

## Stack
- **Vite** + **TypeScript** (strict). No UI framework: vanilla TS modules and DOM.
- **Canvas 2D** for all image work and particles. **Web Animations API (WAAPI)** for DOM motion. One shared `requestAnimationFrame` loop (the Ticker) for everything driven per frame.
- **Web Audio API**: every sound is synthesized in code. **No audio files.**
- Fonts are self-hosted: `@fontsource/cormorant-garamond` (300, 500, 300-italic) and `@fontsource/inter` (400, 500). No Google Fonts requests.
- Testing: **Vitest** + **fast-check** (property-based) for `src/core` and `src/motion`. **Playwright** for end-to-end tests in Chromium and WebKit.
- Lint/format: ESLint + Prettier with recommended configs.
- Deploy: **GitHub Pages** via GitHub Actions on push to `main`. Vite `base` = `/am-i-still-me/`.

## Hard constraints
- 100% client-side. After first load, **zero network requests** (verified by an e2e test).
- Never upload, store or log the user's image. No image data in localStorage, sessionStorage, IndexedDB, cookies or the console.
- Settings (mute, language) may live in localStorage. Always wrap storage in try/catch.
- Must work on: latest Chrome, Edge, Firefox, Safari (macOS + iOS 17+), Android Chrome.
- Webcam needs HTTPS, which GitHub Pages provides. Handle permission denial gracefully.

## Motion engine rules (details in motion.md)
- **One Ticker**: a single rAF loop. `dt = clamp(elapsed, 0, 0.1 s) × speed`. Clamping prevents a "spiral of death" after tab switches. Subscribers return `false` to unsubscribe. The loop stops when nothing is subscribed.
- **Springs**: semi-implicit Euler with fixed **1/240 s substeps**. Rest test: `|x − target| < max(0.0005·travel, 0.001)` AND `|v| < max(0.005·travel, 0.01)`, then **snap exactly** to the target. The absolute floors are required: a purely relative threshold never fires for tiny travels (bug found by a property test).
- DOM animation uses WAAPI with `linear()` spring easings generated from the same presets. Fall back to `cubic-bezier` when `linear()` is unsupported, detected once at startup with try/catch on `element.animate`.
- Animate only `transform`, `opacity`, `clip-path` and `filter` (short text blur only). Never animate layout properties, except the single ink-drop ring.
- Hover lift uses the CSS **individual** `translate` property, so it never fights WAAPI `transform` animations.
- Entrance animations use `fill: 'backwards'`, so elements stay hidden during their delay. Exit animations use `fill: 'forwards'`. After a scene is hidden, cancel every script animation in its subtree. Never leave `fill: 'both'` animations piling up.
- Every async choreography captures an **epoch token** and checks it after every `await`. Jumping or restarting increments the epoch, so stale sequences stop silently.
- Global `speed` multiplier (`?speed=`) applies to the Ticker, setTimeout-based waits and WAAPI `playbackRate`.

## Performance budget
- Initial JS ≤ 120 KB gzipped (fonts excluded).
- 60 fps on a mid-range phone. One tile swap draws in < 4 ms on an 8×8 grid.
- Precompute the 5 ghost effect images once (chunked across frames). Never recompute pixels during animation.
- Downscale the source image to max 1024×1024 before processing.
- The portrait canvas redraws only while something is moving. Its rAF subscription ends when everything rests.
- Read pixels back from a canvas **once** (`getImageData`). Multiple readbacks force a CPU canvas (Chrome warns about this). Keep the pixel array instead of reading again.
- Fog: 160×90 canvas, about 20 fps, scaled up with CSS `blur(26px)`. Pause when the tab is hidden.
- Particles are capped at 320. A full-screen FX canvas at DPR ≤ 2 clears to transparent and unsubscribes when empty.

## iOS / Safari quirks to handle
- Use `100dvh`, `env(safe-area-inset-*)`, `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`.
- AudioContext must be created or resumed inside a user gesture (the "Begin the ritual" click).
- Canvas memory limit: keep total canvas area small and set disposed canvases to 0×0.
- `createImageBitmap(file, { imageOrientation: 'from-image' })` may be missing: fall back to an `<img>` decode.
- HEIC decodes only in Safari. Elsewhere show the friendly error.

## Code rules
- Pure logic (grid, RNG, replacement, reassembly, FSM, endings, auto schedule, spring math, director model) lives in `src/core/` and `src/motion/spring.ts` with **no DOM access**, so it is fully testable.
- All randomness goes through a seeded RNG (mulberry32) for reproducible demos (`?seed=1234`). Cosmetic particles may use `Math.random`.
- No `any`. Every exported function has a short JSDoc comment.
- Measure layout **after** content is in the DOM. Re-place shared elements whenever a scene's content resizes (ResizeObserver). See design.md §7.

## Accessibility
- Every action works with the keyboard. Focus is visible (ghost-cyan outline). After each scene transition, focus moves to the scene heading.
- Text contrast meets WCAG AA. Counter changes are announced via `aria-live="polite"`, at most every 5 pieces.
- Sound starts only after a user gesture, and a mute toggle is always visible.
- `prefers-reduced-motion: reduce` → the reduced-motion mapping in motion.md.
