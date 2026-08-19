# 0010 — Lesson progress indicator semantics

Status: accepted
Date: 2026-08-19

## Context

Every Home card needs a progress/badge indicator with four states — never tried / attempted
(completed but no badge) / badge / perfect badge — readable by pre-readers, and per the design
rules it must never rely on color alone. The progress store only persists `{best, total, badge}`,
so "attempted" must be derivable, not stored.

## Decision

Two-part indicator on each card:

1. **Star row = best score**: one ⭐ per correct answer in the best attempt, ☆ for the rest
   (`☆☆☆` muted before any attempt). Shape carries the information; a 5-year-old can count stars.
2. **Status pill** for completed attempts: "Devam et 💪" (attempted), "Rozet 🏅" (earned),
   "Süper 🌟" (perfect). The pill's colored border (coral/sun/grape) is only an accent —
   meaning lives in the emoji + text, and pill text stays ink-on-surface per the contrast policy
   (ADR 0006).

"Attempted" is derived: a stored result whose `badge === 'none'`. Until the store rehydrates
from AsyncStorage, cards show the neutral no-progress visuals instead of a wrong "never tried"
claim being announced to screen readers — the a11y label always matches what is shown.

## Alternatives considered

- **Progress bar / percentage** — abstract for pre-readers; a number like "67%" means nothing at
  this age, and the store tracks one attempt, not continuous progress.
- **Color-coded card border only** — cheapest visually, but violates the "never color alone"
  accessibility rule outright.
- **Storing the attempted flag** — redundant state that can drift from `badge`; deriving it from
  the stored badge keeps one source of truth.

## Consequences

- The indicator works for any quiz length (stars come from `total`), not just 3 questions.
- Screen readers get a full sentence per card ("Ders 3: X. Rozet kazanıldı") via
  `accessibilityLabel`; the star row itself is hidden from them to avoid emoji noise.
- Emoji rendering differs slightly per Android vendor — acceptable; shapes remain distinct.

## References

- Accessibility props on RN components: https://reactnative.dev/docs/pressable
- zustand selectors/persist: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
