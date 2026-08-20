# 0053 — Cleanup policy: dedup, dead code, translation hygiene

Status: accepted (extends 0021's cleanup pass; amends 0036's extraction rules)
Date: 2026-08-20

## Context

Final-round sweep over `app/` + `src/` for duplicated logic, unused exports, unused
dependencies and dead translation keys. The risk in a cleanup round is deleting things that
are used invisibly (Expo Router's file-convention routes, ambient `.d.ts`, dynamic i18n keys,
config-plugin dependencies) or "deduplicating" code whose sameness is coincidence. A written
policy decides what moves, what gets deleted, and what deliberately stays.

## Decision

**Logic duplication is extracted; visual repetition stays.** Repeated behavior (clamp math,
star-count sanitizing, the pulse loop, the image-error report, the hydration-gated selector)
moved into the established homes (`src/utils`, `src/lib`, `src/hooks`, the store). Repeated
`StyleSheet` blocks (screen shells, bordered cards, shadows, text spreads) are the RN idiom —
each component stays readable on its own; extracting shared style objects would couple
components visually and contradicts the no-UI-kit rule (0006).

**"Unused" requires evidence, not a tool verdict.** Symbols exported but only referenced
inside their own module were de-exported (declarations kept — all are used internally);
test-only exports stay and their headers say so. `npx knip` and `npx depcheck` ran as
witnesses, and every flag was triaged against the runtime reality before acting.

**Translation keys are dead only when neither a literal usage nor a reachable dynamic
construction exists.** A script flattened the 140 keys and matched each against quoted
namespace-relative paths in `app/`+`src/` (plural suffixes stripped), with dynamic-key sites
resolved to their _closed value unions_ — for `questions.color.*` the reachable set was parsed
from the actual `shapeOpt(shape, color)` calls rather than allowlisted wholesale. Result: the
7 unreachable `questions.color.*` entries (background, surface, ink, muted, primaryDark,
skyDark, border) deleted from both files; every other key has a verified site.
`SpeakableColor` is derived with `keyof` from the JSON, so the deletion narrows the type and
the compiler enforces the new boundary.

**Same text ≠ same key.** Every identical-value pair found serves a distinct UI slot
(tab label vs screen title vs button, `welcome.start` vs `map.start`, plural `_one/_other`
pairs Turkish legitimately repeats, question-bank option values that are data) — so none were
merged into `common`. Consolidation would couple copy that must stay free to diverge; the
`common` namespace remains reserved for strings shared _by design_ (retry, tabs, mascot a11y).

**The parity test now also rejects duplicate keys in the raw JSON source** (JSON.parse keeps
only the last duplicate, silently), alongside the existing key-set parity, empty-value,
plural-resolution and placeholder checks.

## What moved / was removed

- `src/lib/stars.ts` (new): ⭐/☆ glyphs + `starCounts` clamp, deduping StarRow/StarReveal
  (also fixes a latent `NaN` total passthrough both copies shared); unit-tested.
- `src/hooks/usePulse.ts` (new): the 1 → target → 1 breathing loop duplicated between
  MapNodeRow (scale) and SegmentedProgress (opacity); owns the reduced-motion gate.
- `reportImageError` in `src/lib/errors/handleError.ts`: the silent MEDIA image-load report
  duplicated across AnswerTile / ExitConfirmSheet / LessonBubble.
- `useHydratedResults` in `src/store/progressStore.ts`: the hydration-gated results selector
  duplicated byte-identically in the exercises and dashboard tabs; `EMPTY_RESULTS` became
  module-private.
- LessonBubble's four hand-rolled `Math.min(Math.max(…))` chains now use `clamp` (finishes
  the "one clamp rule" pass).
- De-exported 14 internal-only symbols (types in questions/quiz/scoring/mapPath/errors/
  ChunkyButton, `SUPPORTED_LANGUAGES`, `resolveDeviceLanguage`).
- Removed devDependency `typescript-eslint`: the flat config never imports it —
  `eslint-config-expo` ships `@typescript-eslint/eslint-plugin` + parser as its own
  dependencies, and the `@typescript-eslint/no-explicit-any` rule resolves through them.

## Deliberately kept (traceable false positives and non-extractions)

- depcheck flags `expo-splash-screen` (app.json config plugin), `react-native-worklets`
  (jest resolver + Reanimated 4 runtime), `@commitlint/*` (commit-msg hook) — all used
  outside the import graph.
- knip lists `expo-updates` / `expo-system-ui` as "unlisted" from app.json config keys;
  neither is needed in Expo Go (no OTA updates; `userInterfaceStyle` is inert without a
  custom build) — not installed on purpose.
- Test-only exports (`allQuestionSets`, `migrateProgress`, `PROGRESS_VERSION`, `mapLessons`,
  `LessonsPage`, `nodeColumn`, `MIN_TILE_HEIGHT`, `UNLOCK_STARS_REQUIRED`) — deliberate seams,
  documented in their headers.
- zustand persist boilerplate across the three stores: a generic factory fights the
  middleware's typing and hides the per-store partialize/migrate differences.
- `SheetShell`/`BannerShell`, the wobble chains, glyph-on-disc blocks, and the symmetric
  logger/haptics/storage wrappers: parameterizing them would trade a readable local pattern
  for a config object; the sameness is idiom, not duplication of a rule.
- The `'#000'` vs `colors.ink` shadow-color inconsistency: visible-output change, out of
  scope for a no-behaviour-change round (noted for a future theme pass).

## Alternatives considered

- **Blanket dynamic-prefix allowlisting** (treat every `questions.color.*` as used because a
  template literal exists) — simpler, but would have kept 7 provably unreachable keys; the
  closed-union check costs one regex over the construction sites.
- **Deleting "unused" keys straight from knip/depcheck-style reports** — both tools are blind
  to husky hooks, app.json plugins, jest resolvers and Expo conventions; every removal here
  required a second, human-verified evidence trail.
- **Merging identical strings into `common`** — rejected: tab labels, screen titles and
  buttons that happen to share text today must stay free to diverge (the "Başla" on welcome
  vs in the map bubble is the canonical example).
- **Extracting shared style objects** for the repeated screen/card/shadow blocks — rejected
  per the design ADR (0006): per-component StyleSheet is the idiom and the repetition is
  visual vocabulary, not logic.

## Consequences

- Two new tiny modules (`stars`, `usePulse`) and two new members on existing modules; five
  duplication sites gone with byte-identical behavior (all 25 suites green, no test deleted).
- The locale files carry only reachable keys, and the compiler + extended parity test guard
  the boundary (a future `shapeOpt('circle', 'ink')` fails to compile; a duplicated JSON key
  fails the suite).
- knip/depcheck stay uninstalled — they ran via `npx` as one-off witnesses; wiring them into
  CI would need a curated ignore-list for the Expo false positives, more config than the
  20-lesson app warrants.

## References

- knip: https://knip.dev/
- depcheck: https://github.com/depcheck/depcheck
- Expo config plugins: https://docs.expo.dev/config-plugins/introduction/
