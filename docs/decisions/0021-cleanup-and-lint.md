# 0021 — Cleanup pass and lint setup

Status: accepted (the Lesson.author removal was reversed by 0029 — titles now compose
from author at render time; every other removal stands)
Date: 2026-08-19

## Context

Before the README rewrite, the tree still carried Expo-template leftovers (14 unused images,
two unused packages), a handful of dead design tokens/strings/props from earlier iterations,
in-code references to internal working documents, and a `lint` script that could not run —
no ESLint config existed and neither `eslint` nor `eslint-config-expo` was installed, so
`npm run lint` would have dropped a reviewer into an interactive setup prompt.

## Decision

Remove everything verified dead by cross-referencing `npx depcheck` output with a manual
grep of every symbol: template assets (react/expo logos, tab icons, tutorial art),
`expo-font` + `expo-system-ui` (no import, no app.json wiring), the unused
`motion.duration` block, `colors.coralDark`/`sunDark`, `touchTarget.minimum`, two dead
strings, the write-only `Lesson.author` field, and ChunkyButton's unused `sun` variant and
`accessibilityHint`/`style` props. Strip decision-record citations from code comments — the
explanatory prose stands on its own. Wire ESLint properly: `eslint` + `eslint-config-expo`
as devDependencies with the documented flat config, and fix all findings.

## Alternatives considered

- **Trust depcheck alone** — it false-positives on packages wired outside imports
  (`expo-splash-screen` via app.json plugins, `react-native-worklets` as Reanimated's peer,
  `typescript` for `tsc`) and under-reports expo-router's requirements
  (`expo-constants`/`expo-linking` have no direct import but must stay). Every removal was
  confirmed by hand; every keep has a reason.
- **Also drop web support** (`react-dom`, `react-native-web`, the `web` script) — web is
  incidental but working; removing it saves nothing at runtime and deletes a working target.
- **Keep the unused tokens "for the design system"** — a token no component can reach is
  documentation debt, not a system; `motion.duration` was actively misleading because all
  animations use tuned per-animation timings.
- **Silence the two `react-hooks/immutability` lint errors globally** — the rule is valuable
  (React Compiler is enabled); the two hits are Reanimated's documented shared-value API
  (`scale.value = …` in press handlers), so they get targeted inline disables with the
  reason instead of a config-wide off switch.

## Consequences

- `npm run lint` now works and is part of the definition of done alongside `tsc` and jest.
- Two fewer runtime dependencies; assets shrink by 14 files.
- Removing ChunkyButton's `sun` variant narrows the button palette to primary/sky; adding a
  third variant later means re-adding a dark-edge token pair.
- The inline eslint-disable comments are version-coupled to the rule name
  (`react-hooks/immutability`); an eslint-config-expo upgrade may rename it.

## References

- ESLint setup for Expo: https://docs.expo.dev/guides/using-eslint/
- Reanimated shared values (`.value` writes): https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/your-first-animation/
