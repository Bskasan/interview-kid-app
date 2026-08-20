# 0052 — Per-question countdown via keyed remount

Status: accepted (amends 0013's reset mechanism)
Date: 2026-08-20

## Context

Bug: advancing to the next question after an in-time answer kept the previous question's
remaining time instead of starting a fresh 15 s. Root cause: the countdown's ticking effect
captures its deadline in a closure and re-runs only when `active` flips. On the advance commit
(`answer` back to null) the hook's arming effect runs **before** the screen's
`reset()`-on-index-change effect — same component, declaration order — so the interval armed
with the leftover time; `reset()` then wrote a full 15 s into state, but `active` never
changed, so nothing re-armed, and the next 100 ms tick recomputed from the stale deadline and
clobbered the reset. The timeout path worked only by accident: `remainingMs === 0` held
`active` false through the advance commit, forcing the arm to happen after the reset's
re-render — which is also why the existing tests (reset only after expiry) passed.

## Decision

Delete `reset()` from `useCountdown` and scope one hook instance to one question: the screen
renders a minimal `QuestionTimer` child (hook + `TimerBar`) with `key={quiz.index}`. Advancing
remounts it, and React guarantees a commit's cleanups run before its effect setups — the old
interval is gone before the fresh instance arms from a full 15 s, so the race is
unrepresentable rather than guarded against. The timing logic itself is unchanged; pause
semantics (answer feedback, exit sheet, AppState background) still live inside the one
instance and never reset. This is the codebase's established reset idiom (`ExerciseVideo
key={playerKey}`, `AnswerGrid key={quiz.index}`).

## Alternatives considered

- **Reset epoch in the effect deps** (`reset()` bumps state the ticking effect depends on) —
  the epoch-triggered teardown runs the old effect's pause-snapshot, which recomputes from the
  stale deadline and clobbers the reset: the same bug through another door. Making it airtight
  needs two ref guards (suppress the snapshot on reset teardown, ignore stale ticks), each of
  which must be defended sequence-by-sequence — fighting React's ordering instead of using it.
- **`resetKey` option with render-time state adjustment** — resets before commit, but correct
  only because a paused frame always separates questions in this screen; reset-while-running
  still needs the cleanup guard, and the pattern mutates refs during render (unsound under
  concurrent rendering).
- **Rewriting the hook as an explicit `{running, deadline} | {paused, remaining}` machine** —
  the cleanest model on paper, but a rewrite of proven, tested pause/expiry logic for identical
  observable behavior, and it still needs a reset delivery mechanism (key or event) anyway.
- **Dropping the sub-tick pause snapshot** (cleanup = `clearInterval` only) — would make the
  epoch fix trivial, but gifts up to one tick (~99 ms) per pause/resume; repeated exit-sheet
  toggles would accumulate free time.

## Consequences

- The whole class of "who runs first" questions disappears with the imperative API; the hook
  no longer runs during the video stage or the finish frame, and the one-frame stale display
  on advance (present even where the old code "worked") is gone too.
- A future consumer wanting an in-place reset must key its own subtree — documented in the
  hook's JSDoc. Remount cost is one `View` + `Text` subtree at most every 15 s.
- The regression lives at screen level (answer at ~8 s left → next question must show 14 after
  one second, not 7), because the fix deletes the API the bug lived in; hook tests pin that a
  fresh instance is fully independent of an expired one.

## References

- Preserving and resetting state (React): https://react.dev/learn/preserving-and-resetting-state
- Synchronizing with Effects — each render has its own Effects: https://react.dev/learn/synchronizing-with-effects
