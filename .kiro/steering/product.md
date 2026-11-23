# Product Steering — "Am I Still Me?"

## One-line pitch
A mischievous haunted mirror that replaces your face piece by piece, then makes you face the Ship of Theseus paradox.

## Hackathon context
- Event: Kiroween 2026 (Devpost). Category: **Costume Contest**, an app with a polished, haunting interface.
- Judges score the UI polish, the idea, and how well we used Kiro (specs, steering, hooks, property-based tests).
- Every decision should make the experience feel **eerie, elegant, alive and finished**. No cheap horror: no jump scares, no gore, no blood splatter.

## Personality: "elegant darkness, playful motion"
- **Looks** like an antique mirror in a dark room lit by one candle (see design-system.md).
- **Moves** like something mischievous lives inside it: springy, bouncy, with squash and stretch (see motion.md).
- The contrast between the two is the signature: quiet visuals, lively physics. Motion is never sloppy. Every bounce comes from a verified spring preset.

## The experience (the "ritual")
1. **Summoning**: a dark landing screen with drifting fog asks, "If every part of you were replaced, would you still be you?"
2. **Offering**: the user gives a face photo (upload or webcam). It never leaves the device.
3. **Framing**: the photo drops into a frame with a bounce. The user picks 4×4, 6×6 or 8×8 pieces.
4. **Replacement**: the portrait cracks into a grid. One piece at a time flips into a "ghost" piece. A counter shows how much of the original remains. Auto mode speeds up like a heartbeat (crescendo).
5. **The First Question**: the candle is snuffed: "Every part of you has been replaced. Are you still you?" Yes / No.
6. **The Second Ship (the twist)**: every original piece flies out of the ghost and rebuilds a second portrait, slightly out of order. Final question: "Which one is you?" The ghost / The reassembled / Neither / Both.
7. **Verdict**: a fog wall swallows the screen. When it lifts, a short poetic ending appears (2 × 4 = 8 endings), plus a downloadable "Certificate of Identity" image.
8. **Replay**: "Restore me" flips every piece back (but are you the same?), or "Begin again" rewinds everything.

## Audience
Hackathon judges and curious people browsing Devpost. They will spend 1–3 minutes. The first 10 seconds must be beautiful and clear.

## Tone of voice
- Quiet, poetic, slightly unsettling. Short sentences. Second person ("you").
- English UI. Optional Japanese and Korean (stretch).
- Example lines: "Original parts remaining: 12 / 36." / "One more plank. Same ship?" / "The mirror gives back what it took…"

## Experience pillars (in priority order)
1. **Atmosphere**: fog, candle-light cursor, scanlines, whisper sounds.
2. **Alive motion**: springs, squash and stretch, signature scene transitions (motion.md).
3. **Clarity**: one obvious action per screen. Input is locked during transitions, so nothing can be double-triggered.
4. **Privacy**: the photo is processed only in the browser. Say so visibly.
5. **Finish**: no broken states, no layout overlap, smooth on mobile, complete with reduced motion.

## Non-goals
- No accounts, no backend, no database, no analytics, no paid APIs.
- No AI image generation. All effects are deterministic Canvas filters.
- No storing photos anywhere, including localStorage.

## Stretch goals (only after the core is done)
- Language toggle EN / 日本語 / 한국어.
- "Share card" sized for social media (1200×630).
- Optional face-centered auto crop with an on-device model, only if it stays offline and light.
