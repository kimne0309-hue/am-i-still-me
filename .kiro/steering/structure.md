# Structure Steering

```
am-i-still-me/
├─ .kiro/                     # specs + steering + hooks (MUST be committed, never gitignored)
├─ .github/workflows/deploy.yml
├─ public/
│  ├─ favicon.svg             # candle / cracked-mirror icon (designed by hand)
│  └─ og-image.png            # 1200x630 preview for Devpost and social links
├─ src/
│  ├─ main.ts                 # bootstraps AppContext, background layers, scene manager
│  ├─ core/                   # PURE logic, no DOM
│  │  ├─ rng.ts               # mulberry32 + pick/shuffle/range
│  │  ├─ grid.ts              # piece rects (integer edges), neighbors, adjacent pairs
│  │  ├─ replacement.ts       # replacement order, effect assignment, reassembly map, restore order
│  │  ├─ schedule.ts          # auto-mode crescendo intervals
│  │  ├─ state.ts             # FSM v2 (states, events, transition table) + SessionData reducer
│  │  ├─ director-model.ts    # pure transition-director model (property-tested)
│  │  ├─ endings.ts           # 8 endings + poetic log pool
│  │  └─ i18n.ts              # all UI strings (EN; JA/KO stretch)
│  ├─ motion/
│  │  ├─ ticker.ts            # single rAF loop, dt clamp, speed
│  │  ├─ spring.ts            # Spring + Prop (spring | tween) — pure math, testable
│  │  ├─ easings.ts           # PRESETS, CSS linear() strings, fallbacks, durations
│  │  ├─ animate.ts           # anim()/enter()/leave() WAAPI helpers incl. reduced-motion mapping
│  │  ├─ text.ts              # dropLetters, floatWords, lettersOut
│  │  └─ micro.ts             # squishy, tilt, wiggle, shake, toast
│  ├─ render/
│  │  ├─ image.ts             # decode, EXIF, validation, crop, downscale
│  │  ├─ effects.ts           # 5 ghost effects (pure pixel functions, v2 dark-preserving)
│  │  ├─ precompute.ts        # chunked effect passes, glow tile, overlay
│  │  ├─ portrait-view.ts     # tile renderer with per-tile springs (lift/flip/land, wobble, flash)
│  │  ├─ fx.ts                # particles (spark/dust/smoke) + flying tiles
│  │  ├─ atmosphere.ts        # fog, grain, candle cursor
│  │  └─ certificate.ts       # 1080x1350 PNG
│  ├─ audio/sound.ts          # synth voices: drone, whisper, tick, thud, crack, whoosh, toll, click
│  ├─ ui/
│  │  ├─ portraits.ts         # shared-element layer: place()/FLIP, layoutFor(), relayout observer
│  │  ├─ scenes.ts            # go(), jump(), show(), input lock, epoch
│  │  ├─ screens/             # landing, offering, framing, ritual, question, ship, verdict
│  │  │                       #   each exports { arrive(ep, ctx), depart(ep, ctx) }
│  │  ├─ components/          # leave-button + confirm dialog, toggles, counter (odometer)
│  │  └─ transitions/         # ink-drop ring, shade, mist wall
│  └─ styles/
│     ├─ tokens.css           # colors, type, spacing, motion tokens (spring easings)
│     ├─ base.css
│     └─ screens.css
├─ tests/
│  ├─ core/*.test.ts          # unit + property tests (P1–P15)
│  ├─ motion/*.test.ts        # spring + director properties
│  └─ e2e/*.spec.ts           # Playwright flows (see qa.md)
├─ index.html
├─ README.md
└─ package.json
```

## Naming
- Files: kebab-case. Types and classes: PascalCase. Functions and variables: camelCase.
- One screen = one module exporting `arrive(ep, ctx)` and `depart(ep, ctx)`.
- CSS classes: BEM-like (`ritual__counter`, `btn--ghost`). Every animated element has a stable class or id.
- Test ids: `data-testid` only where text or role selectors are not enough.
