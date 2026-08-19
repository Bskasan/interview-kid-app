# 0035 — Explicit video state machine; on failure the child decides

Status: accepted (supersedes 0012's unlock-on-error policy; its event-driven happy path stands)
Date: 2026-08-20

## Context

The video step had two booleans (`ended`, `failed`) and two acknowledged gaps: a stalled
load with no error event kept the CTA locked forever (0012 documented this as accepted),
and on failure the quiz CTA silently unlocked — the flow "degraded gracefully" without
telling the child that the questions are about the video they didn't watch. Round 3
explicitly re-decides this: failure surfaces as a real state and the child chooses.

## Decision

The screen owns an explicit machine: `loading → ready → ended | error`, with `error`
entered three ways — the player's `statusChange: error` event, a **12 s ready watchdog**
(still `loading` after 12 s counts as failed; long enough to ride out a slow cell
handshake for a ~1 MB clip, short enough not to feel infinite to a 5-year-old; paused
while the exit sheet is open), and **offline-on-entry** (going offline while `loading`
fails immediately instead of letting the child wait out the watchdog). `ExerciseVideo`
stays dumb and reports `onReady`/`onEnded`/`onError(cause)`. In `error`, the video area is
replaced by `VideoUnavailableCard`: the mascot explains "Video şu an açılmıyor. Sorular bu
videoyla ilgili." and offers "Tekrar dene 🔄" (bumps a `playerKey` — remounting recreates
the player via `useVideoPlayer`; if still offline it stays on the card and logs) and
"Videosuz devam et ➡️" (straight to the quiz). The bottom CTA exists only on the happy
path and enables only on `ended`. Every entry into `error` logs through
`handleError(MEDIA, silent)`. Guards: a late `readyToPlay` never resurrects an `ended` or
`errored` video, and an error event never downgrades `ended` — the child's unlock is kept.

## Alternatives considered

- **Keep unlock-on-error (0012 / original assumption #1)** — "media never blocks the
  flow" was the right instinct, but silently: the child taps into questions about a video
  they never saw. The card keeps the no-blocking guarantee (continue is one tap) while
  making it informed.
- **Auto-skip to the quiz on error** — removes the child's agency entirely and hides that
  anything went wrong; retry becomes impossible.
- **No watchdog, error event only** — the documented 0012 gap: a stall without an error
  event locks the flow forever. Media must never block; a timeout is the only guard
  against silence.
- **`player.replaceAsync()` for retry** — more API surface and SDK-version edge cases;
  remount-by-key hands lifecycle to `useVideoPlayer`, which already owns create/release.
- **Longer/shorter timeout (30 s / 5 s)** — 30 s is an eternity for the target age; 5 s
  false-positives on cell networks. 12 s is a judgment call, recorded here and trivially
  tunable.

## Consequences

- The CTA-unlock contract changed: only `ended` enables it. Tests and the README
  assumption list are updated accordingly (README in the round's final pass).
- Retry is cheap and honest: a remount re-runs the full load, the watchdog re-arms per
  attempt, and an offline retry doesn't fake progress.
- The `videoError`/`videoErrorHint` copy is retired; the card's line explains _why_ the
  choice matters (the questions are about this video).

## References

- expo-video (useVideoPlayer lifecycle, statusChange): https://docs.expo.dev/versions/latest/sdk/video/
- NetInfo: https://github.com/react-native-netinfo/react-native-netinfo
