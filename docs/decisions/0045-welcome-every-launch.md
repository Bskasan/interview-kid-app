# 0045 — Welcome screen on every launch

Status: accepted
Date: 2026-08-20

## Context

The round-5 spec adds a short full-screen intro — mascot, app name, one line, a Start button —
shown on **every** launch (explicit product choice, not a first-run-only onboarding). Risks to
manage: annoying returning users, delaying a child who just wants to play, and the Expo Router
constraint that `app/index.tsx` and `app/(tabs)/index.tsx` would both resolve to `/` (group
segments don't count toward the URL), which forbids the naive "dashboard at (tabs)/index +
welcome at /" layout.

## Decision

Welcome IS the root route: `app/index.tsx` renders it at `/` on every cold start, and the
dashboard lives at `app/(tabs)/home.tsx` instead of `(tabs)/index`. "Başla ▶️" runs
`router.replace('/(tabs)/home')` — replace, not push, so Android back from the tabs exits the
app and never returns to the intro. Mitigations for the every-launch trade-off: the screen is
one tap to dismiss with zero artificial delay — the button is interactive from the first frame;
only the hero (app name + mascot with the intro line as its speech bubble) plays a short
~350ms entrance, disabled under reduced motion (`ReduceMotion.System`). The translated app
display name lives in the `welcome` namespace ("Minik Dersler" / "Little Lessons") — translated
rather than a fixed brand because a pre-reader in either language should hear a name they
understand.

## Alternatives considered

- **First-run-only onboarding (persisted flag)** — friendlier to returning users but overrides
  the explicit product decision; also adds persistent state for a screen whose whole job is
  ritual, not information.
- **Dashboard at `(tabs)/index` + welcome guarded by `<Redirect>`** — keeps the literal
  "index = dashboard" naming but needs a per-launch module flag, and the tab navigator mounts
  before redirecting (tab-bar flash on cold start). The route collision at `/` rules out having
  both as index files at all.
- **Welcome as a modal over the tabs** — no route move, but back/dismiss semantics get murky
  and the tab bar is visible behind it during the intro.
- **Splash-screen-only (no welcome)** — cheapest, but the spec asks for a warm, mascot-led
  entry moment; the native splash cannot carry translated copy or a button.

## Consequences

- Every cold start costs one tap (<2s). Documented in README as a deliberate choice.
- Reloads in Expo Go count as launches (JS restarts), which makes the behaviour easy to verify
  and slightly noisier during development.
- The dashboard's route name is `home` (`/(tabs)/home`), not `index` — invisible to users,
  visible in typed routes.
- Deep links to `/exercise/[id]` still work and bypass the welcome (it only owns `/`).

## References

- Expo Router notation (groups don't affect the URL): https://docs.expo.dev/router/basics/notation/
- router.replace / navigation semantics: https://docs.expo.dev/router/navigating-pages/
- Reanimated entering animations + ReduceMotion: https://docs.swmansion.com/react-native-reanimated/
