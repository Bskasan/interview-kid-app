# 0037 — Categorized constants in `src/constants/`

Status: accepted (supersedes the "FEEDBACK_MS not extracted" clause of 0036)
Date: 2026-08-20

## Context

Name-worthy configuration values were scattered: quiz shape and question seconds lived in the
question bank (`src/data/questions.ts`), the feedback delay and video watchdog were screen-local,
the request timeout sat in the fetcher, the picsum URLs were inline strings, and the 48dp compact
touch size existed three times as raw arithmetic (`touchTarget.primary - 8` twice, a literal
`SIZE = 48` once). `LessonCard`'s `DEFAULT_TOTAL = 3` silently duplicated the questions-per-attempt
value — the clearest failure mode: change one, forget the other.

## Decision

A `src/constants/` directory with one small file per category, no barrel: `timing.ts` (flow
timing — question seconds, answer-feedback delay, video watchdog, request timeout, countdown
tick), `layout.ts` (`TOUCH_TARGET = { primary: 56, compact: 48 }`), `api.ts` (picsum base URL,
page, page size, thumbnail size), `media.ts` (sample video URL, moved from `src/data/`),
`quiz.ts` (questions per attempt). The split rule: **constants = cross-cutting configuration;
`src/theme` = visual design tokens; values with a local derivation stay beside that derivation.**

Deliberately _not_ moved, to keep value and rationale together:

- **Pass threshold** — stays in `src/lib/scoring.ts` as `PASS_RATIO = { numerator: 2, denominator: 3 }`
  beside its integer-math rationale and unit tests. It is a ratio over any total, not a flat
  "2 correct" count; extracting a bare `2` would invite misuse.
- **Options per question** — enforced by the `Question` options tuple type; a numeric constant
  would be unenforced duplication.
- **`AnswerGrid` tile math, `LessonCard` dimensions, animation choreography numbers, skeleton
  count, enter offsets, query tuning** — all single-consumer values whose meaning comes from an
  adjacent derivation or component; `LESSONS_STALE_MS` got a local name instead of a move.

## Alternatives considered

- **One flat `constants.ts`** — everything importable from one place, but it becomes a junk
  drawer where timing, layout and URLs erode into "misc"; categories keep diffs and review scoped.
- **A barrel `src/constants/index.ts`** — rejected for the same reasons as 0036: hides which
  category a file depends on, adds cycle bait, gives Metro extra work.
- **Everything into `src/theme`** — theme is the _visual_ vocabulary (colors, radius, type);
  request timeouts and page sizes are not design tokens, and mixing them would blur the answer
  to "what is themable here?". Touch targets moved _out_ of theme for the same reason: they are
  interaction minimums, not looks.
- **Extracting every literal** — moving choreography numbers (shake offsets, confetti delays)
  or derived layout reservations away from their explanatory comments would make each file
  cleaner and the system harder to understand; restraint documented per value above.

## Consequences

- The 48dp compact size and the questions-per-attempt count each exist exactly once;
  `LessonCardSkeleton` now shares `LESSON_CARD_THUMB_SIZE` instead of repeating `72`.
- `touchTarget` left the theme barrel (`TOUCH_TARGET` in constants), so 0021's "no dead tokens"
  bar still holds: `compact` shipped with three consumers (two since 0039 replaced the
  language toggle).
- Composed picsum URLs are byte-identical to the previous strings — the API tests pass
  unmodified, which is the no-behavior-change proof.
- At production scale the same scheme extends (e.g. `constants/analytics.ts`), with remote
  config replacing file constants for anything ops-tunable.

## References

- Metro (module resolution): https://metrobundler.dev/
