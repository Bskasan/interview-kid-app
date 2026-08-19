# 0003 — expo-video for lesson media

Status: accepted
Date: 2026-08-19

## Context

The Exercise screen plays a short lesson video before the quiz. The player must work inside
Expo Go (see 0001), expose a reliable "played to end" signal (the quiz CTA unlocks only when the
video finishes — assumption #1), and report load errors so media never blocks the flow.

## Decision

Use **expo-video**: `useVideoPlayer` for the player instance and `<VideoView>` for rendering.
It is the current Expo SDK video module, works in Expo Go, and emits status/`playToEnd` events
we can subscribe to for the CTA-unlock and error-fallback logic.

## Alternatives considered

- **expo-av** — the legacy Expo media module. Deprecated and removed from the current SDK; this
  repo bans it outright. Not an option even for "familiarity" reasons.
- **react-native-video** — mature third-party player, but it is a native module that is not part
  of Expo Go; using it would force a custom development build and violate 0001.

## Consequences

- Player lifecycle is owned by the `useVideoPlayer` hook (auto-cleanup on unmount); we subscribe
  to its events for end-of-playback and error states instead of polling.
- `expo install` auto-added the `expo-video` config plugin to `app.json`; it only affects native
  builds and is inert in Expo Go.
- If audio-only lessons ever appear, the matching choice is `expo-audio` (same family, same
  constraint set).

## References

- expo-video (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/video/
