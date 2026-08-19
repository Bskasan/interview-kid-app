# 0013 — Countdown timer: timestamp-based with AppState pause

Status: accepted
Date: 2026-08-19

## Context

Assumption #2 fixes the rules: 15 s per question, timeout counts as wrong and auto-advances,
and the timer **pauses** while the app is backgrounded and resumes on foreground. JS `setInterval`
callbacks are not delivered on time under load, and Android delivers no reliable timers while
backgrounded — a naive implementation would either cheat the child or punish an interruption
(a parent calling, notification shade) with a lost question.

## Decision

`useCountdown(totalSeconds, { running, onExpire })` in `src/hooks/useCountdown.ts`:

- **Timestamp-based**: while active, a deadline (`Date.now() + remaining`) is fixed and every
  100 ms tick _recomputes_ remaining from the clock. Ticks only refresh the display — a delayed
  tick cannot slow the timer down.
- **Pause = gate, snapshot, re-arm**: the timer is active only while `running` (quiz logic:
  stops during answer feedback) **and** the app is foregrounded (`useAppActive`, AppState
  `change` events). Deactivating snapshots the remaining ms; reactivating sets a fresh deadline
  from the snapshot, so backgrounded time is never counted.
- `onExpire` fires exactly once per question (guard ref), re-armed by `reset()` on advance.
  iOS `inactive` counts as not-active → also pauses (safe default).

## Alternatives considered

- **Interval decrement (`remaining -= 1000` per tick)** — simplest and common, but accumulates
  drift under JS-thread load (Reanimated setup, image decoding) and silently keeps "running"
  in background on some platforms. Wrong in exactly the cases that matter.
- **Fixed absolute deadline without pause** — accurate and stateless, but counts backgrounded
  time, violating assumption #2's pause requirement.
- **Counting background elapsed time on return** (deadline + AppState timestamps) — that is the
  _resume-and-penalize_ behavior; explicitly not wanted for this age group.

## Consequences

- Timer accuracy is bounded by the clock, not the event loop; the display granularity is 100 ms.
- The hook is unit-tested with modern fake timers (which also fake `Date.now`): ticking,
  pause/resume via prop and via AppState, single-fire expiry, reset re-arming.
- `remainingSeconds` uses `ceil`, so the child sees "15…1" and 0 only at actual expiry.

## References

- AppState: https://reactnative.dev/docs/appstate
- Jest timer mocks: https://jestjs.io/docs/timer-mocks
