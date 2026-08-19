# 0019 — Visual answer grid for pre-readers

Status: accepted
Date: 2026-08-19

## Context

The quiz rendered four full-width text buttons ("🍎 Elma"). The target users are 5–8 year
olds — many can't read yet, so answers must be recognizable without reading: shapes, colors,
counting, pictures. Four stacked 56dp text rows also wasted the screen's best real estate on
words. Constraints: everything (progress bar, timer, prompt, four answers, mascot) must fit a
small 360×640 Android screen without scrolling; touch targets stay big (small hands); all
existing behavior (single-tap lock, feedback states, timer, reduced motion, TalkBack labels)
must survive; Expo Go only.

## Decision

Replace the button list with a 2×2 grid of equal square-ish tiles (`AnswerGrid` +
`AnswerTile`). The option model becomes a union that carries an optional visual —
`emoji | shape | image` — where either a visible `label` or an explicit `a11yLabel` is
required at the type level, so every option is guaranteed a spoken name at compile time.
Shapes are drawn with `react-native-svg` (bundled in Expo Go); images use `expo-image` with a
mandatory `fallbackEmoji` rendered on load error. Tile size comes from a pure
`computeTileSize(windowDimensions)`: width fills two columns, height is capped square-ish
with a hard 120dp floor — below the floor only the tile's inner visual shrinks (60% of the
short side), never the tap target. The ✓/✗ marks move from text prefixes to a corner badge
(ink glyph on a white disc) and stay in the accessibility label.

## Alternatives considered

- **Keep the vertical list, add emoji size** — cheapest, but four rows + big emoji don't fit
  360×640 without scrolling, and a scrolling answer area is a real UX failure for kids
  (options off-screen get forgotten). The grid shows all four at once, bigger.
- **FlatList with `numColumns={2}`** — brings virtualization we don't need for exactly four
  items, makes per-index feedback and the tuple guarantee awkward, and inserts a scroll
  container into a screen that must not scroll. Two explicit rows are simpler and can't
  mis-wrap on rounding errors (flexWrap can when a computed width is 1px over).
- **Plain `View`s for shapes (borderRadius circle, border-trick triangle)** — avoids a
  dependency, but the border triangle is a well-known hack (jagged edges, no rounded joins)
  and a star is not feasible; mixing two rendering techniques for one visual family is worse
  than one SVG. `react-native-svg` ships inside Expo Go, so the dependency costs nothing at
  runtime.
- **Images everywhere (picsum) for prettier tiles** — Home already depends on the network;
  the quiz must not (it's the offline-safe half of the app). Emoji and drawn shapes are
  offline by construction. We keep exactly one image question (picsum id 237, a stable
  dog photo) to prove the image path + fallback, with an emoji fallback that keeps the
  question answerable offline.
- **Measure surrounding chrome with `onLayout` instead of a `RESERVED_VERTICAL` constant** —
  pixel-accurate, but needs a measure pass (first-frame jump or hidden render), adds state
  and re-layout loops, and can't be unit-tested as a pure function. The constant is derived
  from our own fixed styles, documented in code, and safe: if it's ever off, the floor+shrink
  rule degrades gracefully (smaller artwork, same tap target).

## Consequences

- Pre-readers can answer by recognition; questions read aloud well ("Hangisi üçgen?").
- The option model is richer: content editors must supply a label or an a11yLabel — the
  compiler enforces it, and a data test asserts uniqueness within a question (a screen reader
  must never announce two identical answers).
- One new dependency (`react-native-svg`), SDK-pinned, Expo Go-compatible.
- `computeTileSize` and the feedback projection (`feedbackForOption`, moved to the pure quiz
  lib) are unit-tested without rendering.
- Risk: the `RESERVED_VERTICAL` estimate is coupled to the quiz screen's styles; changing
  those paddings/typography needs the constant revisited (noted in code). At production
  scale, tiles would come from a measured layout or a design-system grid, and images would
  be curated content with proper alt text, not picsum.

## References

- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
- useWindowDimensions: https://reactnative.dev/docs/usewindowdimensions
- Accessibility props: https://reactnative.dev/docs/accessibility
