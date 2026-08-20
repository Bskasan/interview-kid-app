# 0047 — Winding progress map with star-gated unlocking

Status: accepted (supersedes 0007's flat-list presentation; FlatList itself, the paging,
offline and refresh behavior from 0041 all stand underneath)
Date: 2026-08-20

## Context

Round 5 replaces the flat lesson list with a Duolingo-style vertical path: big round lesson
nodes winding down the screen, sequential unlocking, and a per-node bubble. Constraints: the
T1 infinite loading (paged fetch, footer, offline gate, dedupe, global numbering) must keep
working, FlatList virtualization must survive (hundreds of nodes conceptually, 20 today), the
brief's "tapping a list item opens the Exercise screen" is deliberately deviated from (bubble
first — recorded in README Assumptions), and progress semantics must not change.

## Decision

**Stars are the metric; thresholds are unchanged.** Stars = best correct answers (0–3),
derived from the existing `LessonResult.best` (`lessonStars`, clamped) — 2/3 pass = 2⭐,
3/3 = 3⭐. Pure presentation over 0010's semantics; scoring and `mergeResult` untouched.

**Unlock rule as a pure function.** `UNLOCK_STARS_REQUIRED = PASS_RATIO.numerator` (single
source of truth with the pass rule — they can never drift apart). `mapNodeStates(starsInOrder)`
projects ordered star counts to `locked | unlocked | current | completed`: node 0 open, node
N+1 opens when node N has pass-grade stars, `current` = the first open un-passed node (unique
under the chain rule; a fully completed map has none).

**Rows own their connectors.** Serpentine columns cycle left → center → right → center
(consecutive nodes always adjacent — no full-width jumps). Each fixed-height row (116dp,
`getItemLayout` stays measurement-free) draws its own SVG segments: an entry curve from the
previous node's column at the top edge (vertical tangent, so it meets the previous row's
straight exit stub without a kink) plus its own exit stub. Pure geometry (`mapPath.ts`), no
cross-row measurement — virtualization- and paging-safe by construction.

**Node visuals never rely on color alone.** Locked = gray + 🔒; open/current = sky + lesson
number, current pulses gently (reduced motion → static sun ring); completed = green + number,
stars underneath (mirrors the segmented bar's done-green / current-sky vocabulary). Node a11y
label = title + state ("Ders 3: kilitli" / "yıldız 2/3").

**Bubble instead of direct-open.** Tapping any node (locked included) opens one anchored
speech bubble: thumbnail, title, star row, and "Başla ▶️" when open or an encouraging line
when locked — the open path stays two taps (node → Başla). One bubble at a time (single state
slot); outside tap or scroll-begin closes it. The anchor is **computed, not measured**:
`index × rowHeight + nodeCenter − scrollOffset` in the list container's space — deterministic,
testable in jest (native `measureInWindow` callbacks don't fire there), and immune to
virtualization handing back stale frames.

**LessonCard and its skeleton are deleted.** Nothing renders cards anymore; the bubble shows
thumbnail + title on demand, which also means picsum thumbnails now load one-at-a-time instead
of twenty-at-once. Loading state is a plain centered spinner.

## Alternatives considered

- **Keep the flat list (0007)** — meets the brief literally, but the round's goal is the
  gamified path: visible progression, a "you are here" node and a reason to earn 2⭐.
- **Tap opens the exercise directly (the brief's letter)** — one tap fewer, but a locked map
  needs somewhere to say "why not this one", and pre-readers benefit from a confirm step with
  the thumbnail; two taps max is the accepted cost (README Assumptions).
- **One big SVG/ScrollView path** — a single beautiful path, but it draws all N nodes (no
  virtualization) and breaks the T1 paging model entirely.
- **Measured bubble anchors (`measureInWindow`)** — the "obvious" approach; rejected because
  the callbacks are async (flicker between open and anchor), silent in jest, and racing
  virtualization. The computed anchor is exact for fixed-height rows by definition.
- **Storing stars in the record** — see 0048: stars stay derived.

## Consequences

- The child sees a path, not a catalog; lessons gate on real mastery (2⭐).
- Everything T1 guaranteed still holds on the map (same query hook, same footer/refresh/
  offline gates, same testID-driven guard tests).
- A returning user's map re-opens correctly: states derive live from the progress store.
- `home.md` becomes `exercises-map.md`; `home.*` card/pill copy keys go dormant until the T8
  prune (BadgeReveal still reads `home:lessonStatus.*`).
- The deviation from the brief is documented in README Assumptions with its rationale.

## References

- FlatList (getItemLayout, onScroll): https://reactnative.dev/docs/flatlist
- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- Reanimated (withRepeat, cancelAnimation, entering, ReduceMotion):
  https://docs.swmansion.com/react-native-reanimated/
