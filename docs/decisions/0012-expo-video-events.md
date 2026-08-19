# 0012 — Event-driven video stage (expo-video)

Status: accepted
Date: 2026-08-19

## Context

Assumption #1: the "Alıştırmaya Geç" button unlocks only when the video **ends**; if the video
fails, a friendly message appears and the button unlocks anyway — media must never block the
flow. The screen also must not keep playing when the child leaves it or backgrounds the app.
We need reliable "ended" and "failed" signals from expo-video (0003).

## Decision

`ExerciseVideo` subscribes to the player's events with `useEventListener` (from the `expo`
package): **`playToEnd`** unlocks the CTA, and **`statusChange` with `status === 'error'`**
triggers the mascot's error message and unlocks the CTA too. No polling. Playback lifecycle
is owned by `useVideoPlayer`, which releases the player on unmount — switching to the quiz
stage or leaving the screen stops the video structurally. Backgrounding: expo-video's default
`staysActiveInBackground = false` plus an explicit `pause()` when AppState leaves `active`.
The clip autoplays once with native controls (a replay is possible, and a replay ending again
is harmless — the CTA is already unlocked).

## Alternatives considered

- **Polling player.status / currentTime on an interval** — works but wastes cycles, adds
  latency to the unlock, and needs its own cleanup; the player already emits exactly the two
  events we care about.
- **Unlock CTA on a fixed timeout (~clip length)** — no dependency on events at all, but it
  lies: a stalled or rebuffering video would unlock "too early", a replay would re-lock nothing;
  the assignment explicitly wants end/error semantics.
- **`timeUpdate` events to track progress** — needed only for a custom progress UI, which the
  native controls already provide; more events, no benefit.

## Consequences

- The unlock logic is two one-line event handlers; no timers or state polling to maintain.
- A stalled network with no error event keeps the CTA locked (spec-compliant); the child can
  still leave with back. A production app would add a stall watchdog.
- Scrubbing to the end with native controls also counts as finishing — acceptable for this
  age group and scope.

## References

- expo-video (SDK 57, `useVideoPlayer`, `VideoView`, events): https://docs.expo.dev/versions/v57.0.0/sdk/video/
- `useEventListener` (expo package): https://docs.expo.dev/versions/v57.0.0/sdk/expo/
- AppState: https://reactnative.dev/docs/appstate
