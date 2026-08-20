# 0046 — Local day-streak rules

Status: accepted
Date: 2026-08-20

## Context

The dashboard shows "🔥 N gün üst üste" — consecutive calendar days the app was opened. Needed:
a day-boundary definition, behaviour for same-day reopens, gaps, month/year boundaries, DST,
and devices whose clock moves backwards; plus a trigger that catches a foreground crossing
midnight on any screen. Nothing in the app tracked dates before this.

## Decision

Pure rules in `src/lib/streak.ts` over `{ lastOpenDate: 'YYYY-MM-DD' | null, count }`:

- **Local calendar date**, not UTC: the streak day rolls at the child's midnight. Dates are
  compared by calendar-day difference computed via `Date.UTC` on the date parts — immune to
  DST (no 23/25-hour days can off-by-one the diff).
- Same day → the **same object** back (identity contract: the store skips the persist write).
  Next consecutive day → `count + 1`. A gap → reset to 1. **Clock rolled backwards → unchanged**
  (a time-zone trip or manual clock fix must not wipe an earned streak; the streak resumes when
  "today" passes the stored date again). Corrupt stored date → restart at 1.

Persistence in a new `streakStore` (`streak-v1`, same persist pattern and `hasHydrated` gate as
the other stores). Trigger: `useStreakTracker` mounted **in the root layout** (a null-rendering
hook carrier beside the overlays) — fires on `useAppActive` flips once hydrated, so launch AND
every return to foreground count, on any screen. Same-day touches are free no-ops, so firing
often costs nothing.

Honesty note (also in README trade-offs): the streak is local-only and cheatable by changing
the device clock forward. That is accepted — there is no backend, and the reward is a number
on a dashboard, not currency.

## Alternatives considered

- **UTC day boundary** — simpler math but the "day" would roll mid-afternoon or late evening
  depending on timezone; a child who plays every day after dinner could lose streaks to UTC.
- **Timestamp deltas ("within 24–48h")** — avoids date strings but makes the rule opaque
  ("opened 25h apart — same streak?"); calendar days match how families think about "every day".
- **Reset on clock rollback** — punishes legitimate timezone travel and parental clock fixes
  for zero abuse prevention (cheating goes forward, not backward).
- **Trigger on dashboard focus only** — misses a midnight-crossing foreground on another tab or
  during an exercise; the root-level AppState hook costs one no-op per foreground instead.
- **Extending settingsStore** — fewer files, but settings are user _choices_; the streak is
  derived activity state with its own lifecycle, and a separate key keeps both partializes
  trivial.

## Consequences

- Streak logic is exhaustively unit-testable (same-day double open, month/year boundaries,
  gaps, rollback, corrupt data — all covered).
- One more AsyncStorage key (`streak-v1`), written at most once per day.
- The count can only be trusted as far as the device clock — acceptable for a local reward.
- At production scale the same rules would run server-side against authenticated activity
  events; the pure function would move, not change.

## References

- AppState: https://reactnative.dev/docs/appstate
- zustand persist middleware: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- Date.UTC: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
