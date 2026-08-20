# 0017 — Idempotent result recording

Status: accepted
Date: 2026-08-19

## Context

`recordResult` must run **exactly once** per completed attempt (the Result screen's mount),
and never inflate progress — despite React re-renders, StrictMode's double-invoked effects in
dev, remounts of the same route params, or a user re-opening the app on the Result screen.
Assumption #4 also requires abandoned attempts to leave no trace.

## Decision

Three independent layers, any one of which suffices:

1. **Single writer at the destination** — only the Result screen writes progress. The quiz
   never records anything, so abandoning it is automatically a no-op ("discard" = the replace
   to `/result` never happened).
2. **Once-per-mount ref guard** — the recording effect flips `recordedRef` before writing, so
   re-renders and StrictMode's second effect invocation are blocked.
3. **Idempotent merge** — `mergeResult` (unit-tested) only replaces a stored result when the new
   attempt is _strictly better_; recording the same `{correct, total}` again is an identity
   operation. Even a full remount with identical params cannot change stored state.

Recording is skipped entirely for garbage params (`lessonId === ''` or `total <= 0`), and the
success haptic fires in the same guarded effect so it also runs at most once.

## Alternatives considered

- **Record in the Exercise screen before navigating** — a single writer too, but at the source:
  a crash or interruption between recording and navigation would persist progress for a Result
  the child never saw, and dev-mode double effects would need the same guard anyway — with the
  added risk of racing the back-guard logic.
- **Attempt-id nonce in params** (record only if unseen id) — extra plumbing and persisted
  bookkeeping to solve what layers 2+3 already solve for free.
- **Rely on the merge idempotency alone** — would technically hold today, but the haptic (and
  any future analytics call) would fire on every re-render; the ref keeps side effects honest.

## Consequences

- Progress can only move upward, matching the best-result policy; replaying the Result screen
  is harmless.
- The lesson list reflected the new badge immediately on return because its cards subscribed to
  the store, and navigation is `replace`, so no stale screen instance survives. Since 0047 the
  same holds for the map: it subscribes to the store, so earning 2⭐ unlocks the next node live.
- If richer analytics ever need exactly-once _delivery_ (not just idempotent state), a real
  attempt id would be introduced (noted for production).

## References

- zustand store updates: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
