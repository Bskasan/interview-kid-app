# 0049 — Per-question outcome history in the quiz machine

Status: accepted (extends 0015's quiz flow; presentation extends 0006's never-color-alone rule)
Date: 2026-08-20

## Context

The segmented progress bar treated every past question as "done = green", regardless of how it
went. Round 5 wants each segment to show its outcome (✓ / ✗), but the pure quiz machine kept no
history: `advanceQuiz` discarded the per-question answer, leaving only the running `correct`
counter.

## Decision

`QuizState` gains `outcomes: ('correct' | 'wrong' | 'timeout')[]`, **appended at lock-in time**
in `answerQuestion`/`timeoutQuestion` — not at advance time — so the current segment flips to
its outcome during the 1.4 s feedback window (progress is immediately visible, principle 3).
The existing null-answer guards already make double-pushes impossible; `advanceQuiz` is
untouched. Timeout is stored distinctly: visually it renders like wrong (coral ✗ — a
5-year-old doesn't need a third color), but the extended accessibility label announces it
honestly ("Soru 2: süre doldu").

`SegmentedProgress` renders per-segment outcomes: green/coral fill with an ink ✓/✗ glyph on a
small white disc (coral is never a text-bearing surface, 0006), the current question as a
white segment with a sky outline and a gentle opacity pulse (reduced motion → static), and
upcoming segments beige. Segments grow 10 → 18dp to fit the glyphs — still inside the top row
that the 48dp exit button sizes, so `AnswerGrid`'s `RESERVED_VERTICAL` and the pinned tile
sizes are unchanged. The row's single accessibility label extends to
"Soru 2/3. Soru 1: doğru, Soru 2: yanlış…". The per-question countdown bar is untouched.

## Alternatives considered

- **Derive history in the screen (useState alongside the machine)** — splits quiz truth across
  two owners; the pure machine exists precisely so transitions stay unit-testable in one place.
- **Push the outcome on advance** — simpler mentally, but the bar would only update after the
  1.4 s feedback, wasting the moment when the child is actually looking at it.
- **A third color/glyph for timeout** — more honest visually, but three feedback colors on a
  10-segment-wide strip overloads a pre-reader; the distinction is preserved where it matters
  (screen reader), invisible where it would only add noise.
- **Per-segment accessibility nodes** — segments are ~100dp wide targets with no action;
  swipe-through would cost three stops to learn what one sentence says.

## Consequences

- The machine's history now also reaches the Result flow if ever needed (e.g. per-question
  review) without another refactor.
- `outcomes` grows the state by one array of ≤3 entries per attempt — negligible.
- Tests: outcome-push cases in the machine suite; a new component suite pins glyphs, the
  combined label and the reduced-motion path.

## References

- Reanimated (withRepeat, cancelAnimation, useReducedMotion):
  https://docs.swmansion.com/react-native-reanimated/
- RN accessibilityLabel: https://reactnative.dev/docs/accessibility
