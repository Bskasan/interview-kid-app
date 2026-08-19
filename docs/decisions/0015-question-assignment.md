# 0015 — Deterministic question assignment and quiz flow policy

Status: accepted
Date: 2026-08-19

## Context

Quiz content is local mock data (per the brief), but 20 lessons share it. Retakes keep the
_best_ result (assumption #3), which is only fair if a retake answers the same questions.
The quiz also needs rules for double-taps and for what happens right after an answer.

## Decision

- **Five question sets** in `src/data/questions.ts` (colors, counting, animals, addition,
  shapes — Turkish, emoji-paired, 3 questions × 4 options). A lesson picks its set with a
  **stable string hash of the lesson id** (`getQuestionSet`), so the same lesson always asks
  the same questions with no storage involved.
- **Pure state machine** (`src/lib/quiz.ts`): `answerQuestion` / `timeoutQuestion` /
  `advanceQuiz` over `{index, correct, answer, finished}`. A locked answer ignores further
  taps (rapid double-tap guard) and a timeout that races a tap loses. The screen only renders
  this state and schedules `advanceQuiz` after a short feedback delay.

## Alternatives considered

- **Random set per attempt** — more variety, but breaks best-result semantics (a lucky easy
  set beats a hard one) and makes bugs irreproducible. Rejected for fairness.
- **One shared set for all lessons** — simplest, but every lesson feels identical after the
  first; the hash costs three lines.
- **Shuffling options per render** — anti-memorization, but the correct answer moving around
  between retakes confuses young kids and breaks "the same lesson is the same quiz".
- **Quiz logic inside the component (useState + handlers)** — fewer files, but the double-tap
  and timeout-vs-tap races become untestable render logic; the pure machine gets 9 unit tests.

## Consequences

- `correct` accumulates at answer time, so the finish transition needs no recount.
- Adding real content later = replacing `questions.ts` and the selection function; the machine
  and screen are content-agnostic.
- Deterministic assignment is also what makes the manual test script reproducible.

## References

- jest timer/data-driven testing: https://jestjs.io/docs/timer-mocks
