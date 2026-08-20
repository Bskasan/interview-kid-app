# 0036 — Shared utils layout: `src/utils/`, no barrel exports

Status: accepted (the "FEEDBACK_MS not extracted" clause is superseded by 0037)
Date: 2026-08-20

## Context

Three rounds of features left small helpers duplicated or buried: `clamp` existed
privately in `lib/scoring` plus two inline re-implementations, the string hash lived
inside the question bank, route-param coercion was copy-pasted across two screens, the
double-tap navigation lock existed twice with a subtle variant difference, and three
haptics call sites swallowed failures with empty catches.

## Decision

Generic, React-free, side-effect-free helpers move to `src/utils/<name>.ts` with named
exports — `clamp` (float-preserving, non-finite → floor; `scoring` composes its integer
semantics as `clamp(Math.trunc(x), …)` at the call site), `hashString`, and
`paramString`/`paramNumber` in `routeParams`. Everything with React or side effects stays
where it was: the navigation lock becomes `src/hooks/useNavigationLock` (a hook —
`resetOnFocus` covers Home's re-entry variant, the default covers Result's one-shot), and
best-effort haptics become `src/lib/haptics` (side-effectful, and its `.catch` now reports
through the logger instead of an empty lambda). **No barrel `index.ts`**: imports name
their file directly, which keeps dependency edges greppable, avoids the circular-import
bait barrels create, and gives Metro nothing extra to resolve. Deliberately _not_
extracted: `AnswerGrid`'s tile sizing (its floor-priority `max(MIN, min(width, v))` is not
a clamp — the touch floor must win when the bounds conflict), `FEEDBACK_MS` (single use),
and the quiz machine (already `lib`, domain logic).

## Alternatives considered

- **Everything into `src/lib/`** — `lib` is the tested, domain-logic layer (scoring, quiz
  rules); mixing generic primitives in blurs the "what is business logic here?" answer an
  interviewer will ask.
- **A barrel `src/utils/index.ts`** — one convenient import path, but it makes every util
  a dependency of every consumer (worse for tooling and cycle risk) and hides which helper
  a file actually uses.
- **Forcing `clamp` into AnswerGrid** — a util applied where the semantics differ is a
  refactor that changes behavior on small screens; left explicit with a comment.
- **A generic `haptics.trigger(kind)` API** — two call shapes exist (success, light
  impact); two named functions are simpler than a stringly-typed dispatcher.

## Consequences

- Each helper has one home and unit tests (`__tests__/utils/*`); the scoring tests keep
  covering the integer-clamp behavior through the public API.
- Haptics failures are now visible in dev logs — the last silent `catch(() => {})`s are
  gone.
- The `utils` bar is documented: React-free, side-effect-free, generic. The next helper
  has an obvious home and an obvious test location.

## References

- Metro (module resolution): https://metrobundler.dev/
- React Navigation useFocusEffect (via Expo Router): https://reactnavigation.org/docs/use-focus-effect/
