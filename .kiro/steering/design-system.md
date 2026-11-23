# Design System Steering — "Haunted Mirror"

The whole app should look like an **antique mirror in a dark room lit by one candle**: elegant, quiet, cold. Motion rules live in `motion.md`. This file covers the visual language.

## Color tokens
| Token | Value | Use |
|---|---|---|
| `--void` | `#07070b` | page background |
| `--ink` | `#0f0f16` | panels, toasts |
| `--mist` | `#1a1b26` | dividers |
| `--mist-2` | `#2b2d3c` | borders, frames |
| `--bone` | `#e8e4da` | primary text, button borders (72% alpha) |
| `--ash` | `#a7a397` | secondary text (AA on --void) |
| `--ghost` | `#9fe7f5` | accent: focus ring, glows, progress, ghost-tile edges |
| `--ghost-dim` | `rgba(159,231,245,.18)` | hover backgrounds, halos |
| `--ember` | `#ffb46b` | candle cursor only |
| `--wound` / `--wound-lit` | `#7a1f2b` / `#c24a5a` | **only** the "Nobody in the Mirror" ending title and the NEITHER button hover |

Rule: 90% of the screen is dark neutrals. Accents are rare, so they stay powerful.

## Typography
- Display: **Cormorant Garamond** 300/500 (+300 italic). Titles, questions, endings, log lines.
- UI: **Inter** 400/500, uppercase with wide tracking (0.22–0.34em) for buttons, labels and counters.
- Scale: hero `clamp(3rem, 11vw, 6.6rem)`; questions `clamp(1.9rem, 5.4vw, 3.4rem)`; ending title `clamp(1.7rem, 4.6vw, 2.7rem)` italic 500; body `clamp(1.08rem, 2.6vw, 1.32rem)`; labels 0.62–0.74rem.
- `text-wrap: balance` on titles and questions, `text-wrap: pretty` on body text (no orphan words).
- Counters use `font-variant-numeric: tabular-nums`.

## Spacing & layout
- 8 px base grid: 4 / 8 / 16 / 24 / 40 / 64 / 104.
- Every scene is a centered flex column with gap `clamp(12px, 2.4dvh, 26px)` and safe-area padding.
- Portrait slot sizes (square):
  - framing `min(60vmin, 44dvh, 420px)`
  - ritual/question `min(86vw, 50dvh, 500px)`
  - second ship `min(36vw, 50dvh, 400px)`, or stacked on < 720 px: `min(62vw, 27dvh)`
  - verdict `min(70vw, 40dvh, 430px)`
  - when height < 700 px: ship `min(56vw, 24dvh)`, ritual `min(80vw, 44dvh, 460px)`
- Must fit without scrolling at 375×667 (iPhone SE) and 390×844.

## Layers (z-order, bottom → top)
0 fog canvas · 1 portrait layer (shared elements) · 2 vignette + snuff shade · 3 scenes (text + controls) · 4 FX canvas (particles + flying tiles) · 5 candle glow · 6 ink-drop ring · 7 mist wall · 8 toast · 9 grain · 10 leave button / dialog.

## Signature details
1. **Candle cursor**: a 620 px warm radial glow (`--ember` at 14% → 0), `mix-blend-mode: screen`, following the pointer with a lagging spring and a gentle flicker. Hidden on touch, where a glow appears at each tap and fades.
2. **Fog**: slow 2-octave value noise, pale grey-cyan, denser toward the bottom, heavily blurred.
3. **Scanlines + vignette** baked into the portrait overlay (lines every 4 px at 11% black; radial vignette to 50%).
4. **Breathing frame**: the portrait frame's cyan glow pulses (opacity .35 ↔ .85, 6 s).
5. **Grain**: a 128 px noise tile over everything at 5.5% opacity, jittering in 4 steps per 0.9 s.
6. **Ghost-tile edges**: each ghost piece has a faint inner cyan edge glow (30% → 0 over 16 px of a 256 px tile), so replaced areas read at a glance without forming a harsh grid.

## Components
- **Button**: pill (`border-radius: 999px`), min-height 48 px, 1 px `--bone` border at 72%, transparent background (primary: 4% bone fill), Inter 500 0.74rem, tracking 0.24em. Hover: lift 2 px, border `--ghost`, 26 px glow, text glow. Focus: 2 px `--ghost` outline at 4 px offset. Press: squash & stretch (motion.md M2).
- **Ghost button**: no border, `--ash` text, turns `--bone` on hover.
- **Pulse ring** on "Begin the ritual": the shadow ring expands to 16 px and fades, 2.8 s loop.
- **Offering cards**: 18 px radius, 1 px `--mist-2` border, subtle vertical gradient, 3D tilt on hover (M6). On < 720 px they become horizontal rows (icon left).
- **Size cards** (radiogroup): "4 × 4 / A Whisper", "6 × 6 / A Haunting", "8 × 8 / A Possession". The checked one gets a `--ghost` border and glow. Arrow keys move the selection.
- **Toggle**: 38×22 px track. The 14 px knob slides with the jelly easing and glows when on.
- **Counter**: tiny caps label "ORIGINAL PARTS REMAINING" above a big Cormorant odometer number "23 / 36" (M9).
- **Progress line**: 1 px, the slot's width, fills left→right in `--ghost` with glow (pop easing).
- **Answer grid** (second question): 2×2, equal widths. Below 420 px wide, tracking drops to 0.12em so "THE REASSEMBLED" stays on one line.
- **Leave button** (scenes 1–6): top-right ghost icon button "✕ Leave". It opens a small confirm dialog: "Leave the mirror? Your reflection will be forgotten." with [Stay] [Leave].
- **Toast**: bottom center, `--ink` at 94%, 14 px radius, pop-in, auto-hide 3.4 s.

## Screen-by-screen visual notes
1. **Landing**: eyebrow "A HAUNTED MIRROR", the hero title, an italic subtitle (max 32ch, balanced), BEGIN button with pulse ring, privacy line with a glowing cyan dot.
2. **Offering**: title "Make an offering", two cards ("Offer a photograph" / "Look into the mirror") with line icons in `--ghost`, a Back ghost button.
3. **Framing**: title "Frame your reflection", portrait slot with a faint grid preview of the chosen size, size cards, BEGIN.
4. **Ritual**: counter → portrait → progress line → controls (REPLACE A PIECE + a toggles group [AUTO][SOUND] that wraps as a unit) → italic log line.
5. **First Question**: the portrait dims to 28% under a closing darkness (the shade). The question sits over it, then YES / NO.
6. **Second Ship**: italic intro line, two portraits with tiny caps captions "THE GHOST" / "THE REASSEMBLED", the question, then the 2×2 answers.
7. **Verdict**: floating portrait (or the empty fog frame for "Neither"), italic ending title, body text, actions [DOWNLOAD CERTIFICATE] [RESTORE ME] [BEGIN AGAIN], tiny seed line.

## Certificate (downloadable PNG, 1080×1350)
- Dark paper made in code (noise + vignette), thin double border in `--bone` at 60%.
- From the top: "CERTIFICATE OF IDENTITY" → portrait 760×760 → "Original parts remaining: 0 / N²" → "Still you? YES · Which one? THE GHOST" → ending title (italic) → date → footer "Am I Still Me? — Kiroween 2026".
- Wait for `document.fonts.ready` before drawing.
