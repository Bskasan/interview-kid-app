# 0006 — Design language implementation (tokens, chunky buttons, emoji mascot)

Status: accepted
Date: 2026-08-19

## Context

Target users are 5–8 year olds (early readers); the brief asks for a lively, gamified feel but
explicitly not for visual polish. The repo bans third-party IP (no Khan Academy/Duolingo assets,
mascots, brand colors) and bans UI kits. We need a small, defensible visual system that one person
can build in hours and explain in an interview.

## Decision

Hand-rolled design tokens in `src/theme/` (colors/spacing/radius/typography/motion as plain
TypeScript constants) + two base components that carry the whole feel: `ChunkyButton`
(solid fill, 4dp darker bottom edge that collapses on press, scale spring, haptic tick) and
`Mascot` (an original fox emoji 🦊 in a circle with an optional speech bubble). Cream background,
ink-not-black text, max 2–3 saturated colors per screen, system font.

Contrast note: labels are always `ink` on light fills — ink passes 4.5:1 on background, surface,
primary, sky and sun. White fails on all our saturated fills (e.g. 2.3:1 on primary), and ink on
coral is 4.1:1, so `coral` is never used as a text-bearing surface — only as a feedback fill or
border next to text on `surface`.

## Alternatives considered

- **UI kit (Tamagui / NativeBase / React Native Paper)** — faster generic screens, but banned by
  repo conventions, visually adult-flavored (Material/enterprise), heavy for 3 screens, and theming
  them into a kids look costs more than writing ~10 tokens and 2 components.
- **Nunito via @expo-google-fonts** — a rounded sans would look friendlier; skipped because the
  system font is contrast-safe, zero-load, and the brief explicitly deprioritizes visual polish.
  Easy to add later without touching components (single fontFamily token).
- **Lottie / custom illustrations for the mascot** — richer, but needs sourced assets (IP risk),
  another dependency, and design time. An emoji in a circle communicates "friendly guide" at
  near-zero cost and is trivially original.
- **Copying a familiar look (Duolingo greens, KA Kids characters)** — rejected outright: the repo
  bans third-party IP; we keep only the _principles_ (chunky targets, one action per screen,
  celebration moments) with our own tokens.

**Amendment (2026-08-19, Phase 4):** `muted` darkened `#8C8C8C` → `#6E6E6E` — the original value
was 3.2:1 on cream, below the 4.5:1 floor. Role unchanged. See ADR 0018.

## Consequences

- Every screen styles itself from `src/theme` — changing the palette or scale is a one-file edit.
- Two derived tokens were added beyond the spec (`skyDark`, `sunDark`, `coralDark`) so any chunky
  control can have a matching pressed edge; same role as `primaryDark`.
- No dark mode, no i18n system (Turkish strings centralized in `src/lib/strings.ts` — swapping
  to a real i18n lib later is a mechanical change).
- Motion depends on Reanimated's `useReducedMotion` — every animated component must branch on it.

## References

- React Native Pressable (pressed-state styling): https://reactnative.dev/docs/pressable
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- React Native Reanimated: https://docs.swmansion.com/react-native-reanimated/
