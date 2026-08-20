# 0042 — Tint-layer answer feedback with a constant white visual chip

Status: accepted
Date: 2026-08-20

## Context

Observed on device: in "Yeşil olan hangisi?" (colors set), tapping the green star filled the
tile with full-strength `primary` — the star visually disappeared into its own feedback. The
question bank draws shapes with the same tokens the feedback uses, so any full-strength fill
or border-only scheme has collision cases: `primary` shapes vanish on the old correct fill,
`coral` shapes blur into the wrong-answer border, and the future content set (photos, more
emoji) can collide unpredictably. The fix must be generic for every question type — not a
special case per set — and keep the repo's rules: never color alone (0006/0019), coral is
never a text-bearing surface, reduced motion respected.

## Decision

Feedback now colors only the ring **around** the option's visual, never the visual's own
backdrop, in every state:

1. **Light tint fill** — new theme tokens `successTint #DCF4E1` / `dangerTint #FFE4E1`
   (primary/coral blended at 18% over white; literal hex per the tokens-not-inline-alpha
   convention). `correct` and `revealCorrect` use successTint + `primary` border; `wrongChoice`
   uses dangerTint + `coral` border.
2. **Thick full-strength border** — uniform **4dp in all states** (idle/lockedOut keep the
   beige `border` color), so a state change never shifts layout and the border alone is
   legible feedback.
3. **Existing corner badge** — the 28dp ✓/✗ ink-on-white disc stays; it remains the
   color-independent carrier of meaning (with the shake and the spoken '✓ '/'✗ ' prefixes).
4. **Constant white inner chip** — the visual (shape/emoji/photo/digit) and its caption sit on
   a white `surface` chip (2dp beige border, radius 12) that **never changes with feedback**.
   Green artwork on a green-tinted tile still reads, because the artwork's immediate backdrop
   is always white. The digit tiles gain the same chip, which also ends the old ink-on-full-
   green state for the counting set.

Contrast checked: ink on successTint 9.8:1, on dangerTint 9.4:1 (≥ 4.5:1 ✓); `muted` on the
tints fails (4.4:1), so the tint rule "only ink text on tints" is recorded in the colors
header. The full-strength borders sit at ~2:1 against their own tint — accepted because the
border is redundant reinforcement: the badge glyph (~10:1) and shake carry the meaning.
18% was chosen as the midpoint of the requested 15–20% band: still visibly tinted next to the
cream background, comfortably clear of the muted-text contrast floor. `lockedOut` keeps its
0.55 opacity dimming (the chip keeps the dimmed artwork legible). Shake, press physics and
reduced-motion behaviour are untouched; the visual's share of the tile drops 0.6 → 0.55 to
make room for the chip's padding inside the fixed tile.

Worst cases re-checked across all 5 sets after the change: green star tapped correct (the
reported bug), coral triangle tapped wrong (coral-on-coral), `primary` shapes under a reveal
border, ink digits (previously on full green), the photo/fallback-🐶 tile on dangerTint — all
isolated by the white chip.

## Alternatives considered

- **Outline-only feedback (no fill change)** — weakest signal of all; at a glance the child
  reads tile color first, and a 4dp ring alone is easy to miss mid-celebration. Also already
  half-broken today: coral shapes camouflage against a coral border.
- **Overlay icon only (big ✓/✗ over the visual)** — covers exactly the thing the question asks
  about, and a centered overlay on a photo tile is illegible without a scrim (which is a fill
  by another name).
- **Darkening the tile (pressed-style shade)** — ambiguous with the existing pressed state,
  still collides with dark artwork, and reads as "disabled", not "correct!" — wrong emotional
  tone for a celebration moment.
- **Full-strength fill + white outline around artwork** — knocking out artwork edges works for
  flat SVG shapes but not for photos/emoji, so it fails the "generic for every question type"
  requirement.

## Consequences

- Feedback can never hide or recolor an option's visual, for current and future content alike;
  new question types inherit the guarantee for free.
- Two new theme tokens; the tint rule slightly constrains future design (ink-only text).
- The chip adds one View per tile and shrinks artwork by ~8%; tap targets are unchanged.
- The old "correct = solid green" punch is softened; the celebration moment now leans on the
  badge, haptic and mascot — consistent with "celebrate, don't punish" rather than louder fills.

## References

- WCAG 2.1 contrast minimum (1.4.3): https://www.w3.org/TR/WCAG21/#contrast-minimum
- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
