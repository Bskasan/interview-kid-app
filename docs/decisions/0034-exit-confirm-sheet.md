# 0034 — Exit confirm sheet replaces the native Alert; guard on both stages

Status: accepted (supersedes the Alert surface and quiz-only scope of 0014)
Date: 2026-08-20

## Context

Leaving mid-exercise was guarded (0014), but the surface was a native `Alert` — system
styling, tiny buttons, developer-tone copy — and only the hardware back/gesture path had
it, only during the quiz. There was no visible way for a child to leave on purpose: the
task calls for an always-visible exit control on both stages, with one confirmation
behaviour everywhere.

## Decision

A round 48dp 🏠 `ExitButton` sits top-left on the video stage and every quiz step. Every
exit path — button, hardware back, back gesture — opens the same `ExitConfirmSheet`: a
bottom sheet (RN `Modal`, transparent + statusBarTranslucent, custom Reanimated slide/fade,
instant under reduced motion) showing the lesson thumbnail (so the child sees what they'd
leave), the mascot asking one sentence, and two chunky tiles — "Devam et ▶️" (primary) and
"Ana sayfa 🏠". Staying is the safe default: the primary tile, a backdrop tap and the
system back while the sheet is open (`onRequestClose`) all continue. While the sheet is
open the video pauses (resuming only if it was actually playing), the countdown freezes,
and the feedback auto-advance is held. `usePreventRemove` stays the interception mechanism
but is now armed on **both** stages (`!finished && !leaving`): an accidental back-swipe
mid-video is the same child-error as mid-quiz, and a visible 🏠 that confirms while system
back silently exits would be incoherent. Confirming flips `leaving`, which disarms the
guard for the render in which the stashed navigation action is dispatched (back paths) or
`router.replace('/')` runs (🏠 path). The attempt is discarded by construction — nothing is
recorded before Result. The thumbnail derives from the route id (`lessonThumbnailUrl`), so
the sheet needs no query access and works offline from the image cache.

## Alternatives considered

- **Keep the native Alert** — system-styled, small targets, no thumbnail/mascot, styling
  not ours; fails every design-language rule the rest of the app follows.
- **A gesture-driven bottom sheet (react-native-gesture-handler / a sheet library)** — new
  dependency plus a `GestureHandlerRootView` requirement for what is a two-button modal;
  drag-to-dismiss is also a worse affordance for kids than two explicit tiles.
- **Absolutely-positioned overlay instead of Modal** — `VideoView` is a native surface;
  `Modal` guarantees stacking above it on Android and gives hardware-back interception
  (`onRequestClose`) for free.
- **Confirm-on-back only during the quiz (0014's scope)** — kept the video stage
  one accidental gesture away from silent exit while showing a confirm button next to it.
- **"Ana sayfa" also dispatching the stashed action** — the 🏠 button intercepts nothing;
  `router.replace('/')` states the intent directly, while intercepted back actions replay
  exactly what the system asked for.

## Consequences

- One component, one behaviour: the Alert (and its four strings) is gone; the repo has
  zero `Alert` usages.
- The quiz top row grew by the exit button; `AnswerGrid`'s reserved-vertical budget was
  re-measured (264 → 292) — tile sizes on the reference screens are unchanged and the
  no-scroll guarantee holds.
- Opening the sheet is now a pause point by design; a child can think without losing
  timer seconds — and the sheet freezing the feedback window means state never changes
  behind the question "do you want to leave?".
- `usePreventRemove` firing while the sheet is open cannot happen on Android (Modal eats
  the back event); on any path where it could, the callback just re-stashes and the sheet
  stays — idempotent.

## References

- React Native Modal (transparent, statusBarTranslucent, onRequestClose): https://reactnative.dev/docs/modal
- usePreventRemove: https://reactnavigation.org/docs/use-prevent-remove/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
