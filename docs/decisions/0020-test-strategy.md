# 0020 — Test strategy

Status: accepted
Date: 2026-08-19

## Context

The suite had grown organically: solid pure-logic coverage, but also filler (a walk over a
`const` string literal, store tests duplicating `mergeResult` cases one layer up) and zero
coverage of the riskiest wiring — the Result screen's exactly-once recording, the exercise
back-guard lifecycle, and the new answer grid's locking/accessibility. Component tests were
impossible anyway: the jest config carried a `transformIgnorePatterns` override (template
leftover) that replaced jest-expo's array and silently dropped its Reanimated protections,
and nothing set up Reanimated/worklets, haptics, expo-image or safe-area for rendering.

## Decision

A test earns its place only if its failure would signal a bug a reviewer cares about.
Concretely, three layers:

1. **Pure logic exhaustively** (`src/lib`, mapper, store semantics): thresholds, clamping,
   best-result policy, quiz transitions and races, feedback projection, tile sizing math,
   persistence shape (`partialize`, storage key). Cheap, fast, no mocks.
2. **Screens only at their decision points**, with boundaries mocked (expo-router params/
   navigation, the video component): Result records exactly once even when the effect
   re-fires, skips garbage params, navigation double-tap lock; Exercise arms the back guard
   only while a quiz is in progress and drops it before replacing to Result; the video error
   path still unlocks the quiz.
3. **Components for behavior a child depends on**: grid tiles lock after the first tap,
   every visual kind announces a descriptive Turkish label, a failing image swaps to its
   emoji fallback.

Deliberately not tested: styling and layout output (except the pure sizing function),
snapshots (assert everything, protect nothing), library behavior (Reanimated animations,
zustand internals, expo-video), and full navigation flows (an E2E concern — out of scope,
noted in the README).

Infrastructure: the `transformIgnorePatterns` override was deleted (restoring the preset's
three patterns), Reanimated's official jest mode is enabled via `setUpTests()` plus the
`react-native-worklets/jest/resolver.js` resolver, and jest.setup.js mocks haptics (promise-
returning), expo-image (View passthrough so `onError` is drivable) and safe-area-context
(official mock). Testing Library v14's async API (`await render/fireEvent/unmount`) is used
throughout — an un-awaited `unmount()` demonstrably leaves effects alive.

## Alternatives considered

- **Keep all existing tests and only add** — cheapest, but duplicated policy tests make
  refactors noisy (two layers fail for one change) and trivial tests train reviewers to
  ignore red. Deleting filler is part of the deliverable.
- **Snapshot tests for the screens** — fast to write, but they fail on every intentional
  visual tweak and never say *what* broke; they protect nothing a reviewer cares about here.
- **Full-flow tests rendering the router (Home → Exercise → Result)** — closest to reality,
  but needs expo-router's native stack, NetInfo, expo-video and query persistence all mocked
  together; brittle setup for little added signal over the decision-point tests. A real
  device E2E layer (Maestro) is the honest version of this — listed as future work.
- **Coverage thresholds in CI** — enforces quantity, not judgment; with deliberate
  exclusions (styling, libraries) a percentage gate would push tests back toward filler.

## Consequences

- 65 tests across 10 suites, each named for the behavior it protects; suite runs in ~3 s
  with zero console noise.
- Component/screen tests are now possible at all (transform + Reanimated + mock setup), so
  future UI work can be tested at its decision points instead of by hand.
- Screens are tested through mocked boundaries, so a breaking change *inside* expo-router or
  expo-video would not be caught — accepted: that is library territory and device-test
  territory.
- The `.native`-stripping worklets resolver and the RNTL async API are version-coupled
  (Reanimated 4 / RNTL 14); upgrading either means revisiting jest.setup.js.

## References

- Reanimated testing guide: https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/
- React Native Testing Library: https://github.com/callstack/react-native-testing-library
- Jest timer mocks: https://jestjs.io/docs/timer-mocks
- jest-expo: https://docs.expo.dev/develop/unit-testing/
