# 0014 — Quiz back guard via usePreventRemove + native Alert

Status: accepted (Alert surface and quiz-only scope superseded by 0034; the
usePreventRemove mechanism stands)
Date: 2026-08-19

## Context

Assumption #4: leaving a quiz mid-attempt (Android back button/gesture, any navigation away)
asks for confirmation and discards the attempt. The guard must cover **every** removal path,
must not fire when the quiz finishes and legitimately replaces to the Result screen, and must
not record partial progress (only `recordResult` on Result writes progress — so discarding is
simply _not navigating to Result_).

## Decision

React Navigation's **`usePreventRemove`** hook, imported from **`expo-router/react-navigation`**
— since SDK 56 Expo Router vendors its navigation core and rejects standalone
`@react-navigation/*` imports at bundle time (see the official SDK 55→56 migration guide).
The vendored entry also shares Expo Router's `PreventRemoveContext`, which the standalone
package would not — a plain `beforeRemove` listener without that context cannot reliably block
the native back gesture on a native stack. Enabled while `stage === 'quiz' && !quiz.finished` (0034 widened this to both stages:
`!quiz.finished && !leaving`). The callback showed a native `Alert.alert` and dispatched the
intercepted `data.action` on confirm; 0034 replaced that surface — the callback now stashes
the action and opens `ExitConfirmSheet`, and the dispatch happens in the `leaving` effect.

Finish interplay: the hook is declared **before** the finish effect, and the guard condition
turns false in the same render that sets `finished`, so by the time `router.replace('/result')`
dispatches, nothing intercepts it (replace also triggers removal events — guarding on
`finished` is what prevents a bogus confirm on legitimate completion).

## Alternatives considered

- **Manual `beforeRemove` listener** — the older API `usePreventRemove` wraps; more boilerplate
  (subscription management, e.preventDefault) for identical behavior.
- **BackHandler + hardwareBackPress** — only covers the hardware button, not gestures or
  programmatic navigation; exactly the partial solution that leaks progress.
- **Custom confirmation modal in the design language** — friendlier looking, but a custom modal
  must itself resist the back button (recursion of the same problem); the native dialog is
  modal at the OS level and reliable. Visual polish here is explicitly deprioritized; noted as
  a possible Phase 4 improvement.

## Consequences

- All exits funnel through one confirmation; a confirmed exit simply pops — no progress is
  written anywhere (progress writes happen only on the Result screen in Phase 3).
- The video stage was intentionally unguarded at the time (no answers to lose); 0034
  reversed this so every exit path shares one confirmation surface.
- The Alert's copy lived in `strings.ts` like all user-facing text then; today the sheet's
  copy lives in the `exercise` i18n namespace (`src/locales/*.json`).

## References

- Expo Router SDK 55→56 migration (vendored navigation, `expo-router/react-navigation` entry): https://docs.expo.dev/router/migrate/sdk-55-to-56/
- usePreventRemove (concept/API, React Navigation docs): https://reactnavigation.org/docs/use-prevent-remove/
- Alert: https://reactnative.dev/docs/alert
