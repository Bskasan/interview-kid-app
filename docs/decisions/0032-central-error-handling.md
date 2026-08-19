# 0032 — Central error handling: AppError, handleError severities, dev-only logger

Status: accepted
Date: 2026-08-20

## Context

Nothing observed any failure: zero catch blocks, the query error object was never read,
`onRehydrateStorage` discarded zustand's error argument, the video error payload was
destructured away, and three haptics `.catch(() => {})` swallowed silently. For a kids'
app the bar is double: failures must be _observable_ to the developer and _calm and
technical-detail-free_ for the child.

## Decision

One funnel in `src/lib/errors/`: `AppError` is a **plain discriminated object**
(`{ kind, code: NETWORK|MEDIA|STORAGE|UNKNOWN, userMessageKey, retry?, cause? }`) with a
factory and a guard — not an `Error` subclass, because `instanceof` is brittle across
realms/Hermes and a plain object stores and asserts cleanly. `normalizeError(unknown, code?)`
maps anything thrown: an explicit call-site code wins, fetch's `AbortError`/`TypeError
("Network request failed")` are recognized as NETWORK, everything else falls back to
UNKNOWN. `handleError(cause, { context, severity, code, retry })` normalizes, **always**
logs through `src/lib/logger.ts`, and pushes to the error store unless `severity: 'silent'`.
The logger is the single sanctioned `console` site (file-level eslint-disable with
justification; repo-wide `no-console: error` enforces it), `__DEV__`-gated with an explicit
prod hook point for a crash reporter. The child-facing message is only ever the translated
`errors.*` key — `cause` exists for the log line alone. A thin `reportingStorage` wrapper
around AsyncStorage gives every persistence consumer STORAGE reporting: failed reads
degrade silently to "no data" (the neutral empty states are correct), failed writes notify
(a badge might not survive a restart).

## Alternatives considered

- **Per-screen try/catch and ad-hoc messages** — the status quo's failure mode: N surfaces,
  N phrasings, and silent gaps exactly where nobody wrote a handler.
- **Sentry (or another crash reporter) first** — the right production move, but it reports
  to developers, not to the child, and adds a native-adjacent dependency mid-take-home; the
  logger's prod branch is the deliberate seam where it plugs in later.
- **`Error` subclass with `instanceof` checks** — breaks under minification/multiple
  bundles and serializes badly; the `kind` discriminant costs one property.
- **Throwing AppError everywhere** — inverting the model (all throw sites pre-classify)
  touches every module for no gain; normalization at the funnel keeps call sites one line.

## Consequences

- Every failure now produces at least a structured dev log line with its context tag;
  swapping in a crash reporter is a one-file change.
- `severity` forces each call site to decide "does the child need to know?" — that
  decision is now explicit and greppable.
- `git grep "console\." -- ':!src/lib/logger.ts'` returning empty is part of the
  definition of done, backed by the lint rule.

## References

- zustand persist (onRehydrateStorage error argument): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- expo-video statusChange payload (error field): https://docs.expo.dev/versions/latest/sdk/video/
- TanStack QueryCache onError: https://tanstack.com/query/latest/docs/reference/QueryCache
