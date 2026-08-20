# Exercises map (Alıştırmalar tab)

Route: `app/(tabs)/exercises.tsx` — the winding lesson path inside the tab shell (replaces the
flat card list; see shell.md for the shell itself). Data layer unchanged from the incremental
loading round (ADR 0041); presentation per ADR 0047.

## a) What the user sees

All copy is resolved from `src/locales/{tr,en}.json` at render time; Turkish is quoted here.

1. Header: "Alıştırmalar" title. Below it, big round lesson nodes wind down the screen
   (left → center → right → center), joined by a soft beige path line.
2. Node states:
   - **Locked**: gray with a 🔒 — most lessons start locked.
   - **Open / current**: blue with the lesson number; the current one (first not yet passed)
     gently pulses ("you are here"); with reduced motion it wears a static yellow ring instead.
   - **Completed** (≥2⭐): green with the number and its ⭐ row underneath.
3. The catalog arrives **10 nodes at a time as the child scrolls** (fixed 20-lesson catalog);
   while the next page loads, a small spinner + "Daha fazla ders geliyor…" shows under the
   path; nothing extra at the end.
4. Tapping ANY node opens a speech bubble anchored to it (pointer at the node): thumbnail,
   "Ders N: {author}" with a 🔊 read-aloud button (visual affordance, ADR 0050), the star
   row, and — if the lesson is open — a big "▶️ Başla" button;
   if locked, the line "Önce bir önceki alıştırmayı bitir! 💪" instead. One bubble at a time;
   tapping elsewhere or scrolling closes it. Open path = two taps max (node → Başla).
5. Earning ≥2⭐ on a lesson unlocks the next node immediately on return from the Result screen.
6. Pull-to-refresh, the offline banner and cached pages behave exactly as the old list did
   (offline: cached nodes + banner, no bottom spinner; reconnect: scrolling loads more).

## b) How it works in code

- **Data layer (unchanged, ADR 0041)** — `src/api/lessons.ts`: `fetchLessonsPage(page)` GETs
  `https://picsum.photos/v2/list?page=N&limit=10` (10s abort timeout) and returns
  `{ lessons, page, isLastPage }` (end judged on the RAW length; hard cap
  `LESSONS_TOTAL_LIMIT` 20 → never past page 2). `mapLessons(data, page)` numbers by page slot
  ((page−1)×10 + index + 1); `flattenLessonPages` dedupes across pages;
  `canLoadMoreLessons` gates `onEndReached`; `useLessons` = `useInfiniteQuery` with
  `select`-flattening. Persisted via the root provider (buster `lessons-v3`, ADR 0008).
- **Stars & unlocking** — `src/lib/unlock.ts` (pure, unit-tested):
  `UNLOCK_STARS_REQUIRED = PASS_RATIO.numerator` (2 — single source of truth with scoring);
  `lessonStars(result)` = clamped best; `mapNodeStates(starsInOrder)` →
  `locked | unlocked | current | completed`. The screen derives both arrays with `useMemo`
  from the flattened lessons + the progress store (subscribed, so unlocks happen live).
- **Geometry** — `src/lib/mapPath.ts` (pure): serpentine `nodeColumn(index)` over
  `MAP_COLUMN_X` fractions (`src/constants/map.ts`), `nodeCenterX`, and per-row SVG segments:
  `entryPath` (curve from the previous column at the row's top edge, vertical tangents — joins
  the previous row's `exitPath` stub without a kink). Fixed `MAP_ROW_HEIGHT` (116) keeps
  `getItemLayout` measurement-free, so virtualization + paging keep working.
- **`src/components/MapNodeRow.tsx`** — one row: its connector `Svg` + the node `Pressable`
  (72dp, ≥64dp target). Current-node pulse via `withRepeat(withSequence(withTiming))`,
  cancelled on state change; reduced motion → static `sun` ring. A11y label =
  `map:nodeA11y` = title + state ("kilitli" / "açık" / "yıldız 2/3"). Stars under the node via
  the extracted `src/components/StarRow.tsx` (the old LessonCard inline row, now shared;
  LessonCard + its skeleton are deleted).
- **`src/components/LessonBubble.tsx`** — absolute overlay over the map viewport: transparent
  backdrop `Pressable` (labelled "Kapat" for TalkBack escape) + the card with a rotated-square
  pointer, flipped above the node when it sits low in the viewport, clamped at the edges. The
  anchor is **computed** — `index × MAP_ROW_HEIGHT + NODE_CENTER_Y − scrollOffset` (tracked via
  `onScroll` into a ref) — never `measureInWindow` (async, jest-silent, virtualization-racy).
  `onScrollBeginDrag` closes the bubble so it can never point at a moved node.
- **`app/(tabs)/exercises.tsx`** — composes it all; `useNavigationLock` still guards the
  Başla push; footer / RefreshControl gating (`isRefetching && !isFetchingNextPage`) and the
  offline gate are byte-identical to the list version.
- **Progress storage** — `src/store/progressStore.ts` now carries `version: 1` + the exported
  `migrateProgress` (ADR 0048): legacy records are normalized once (drop junk, clamp best,
  recompute inconsistent badges) so the unlock chain can trust stored data; the key stays
  `progress-v1` (renaming would delete earned progress). Stars are derived, never stored.

## c) Edge cases handled

- All list-era cases still hold: malformed payloads/items skipped; cross-page id dedupe (stable
  keys); raw-length end detection; multi-fire `onEndReached` (pure gate + `cancelRefetch:
false`); offline → no fetch, no stranded spinner; failed page → earlier pages stay; 10s
  abort; offline cold start with cache → nodes + banner; hard 20-lesson cap.
- Unlock chain with corrupt storage → normalized at migration AND clamped at read; an inflated
  `best` can never unlock everything.
- 1/3 result (1⭐) does NOT unlock the next lesson; the current node stays current.
- Fully completed map → no pulsing node (nothing left to point at).
- Bubble vs scrolling → closes on drag start (a computed anchor can't go stale on screen).
- Bubble near screen edges → horizontal clamp; low nodes flip the bubble above.
- Rapid node taps → single bubble state slot; double-tap on Başla → navigation lock.
- Language switch → titles, states, bubble copy all re-render from `t()` (map state itself is
  language-neutral store data).
- Store not yet rehydrated → everything renders locked-except-first for a frame, then settles;
  no crash, no bogus unlocks.
- Reduced motion → no pulse (static ring), no bubble fade.

## d) Manual test steps

1. Fresh install (or cleared storage): only node 1 is blue and pulsing; all others gray 🔒.
2. Scroll down → footer spinner + "Daha fazla ders geliyor…" → nodes 11–20 append with the
   path continuing; numbering continuous; fast fling loads one page.
3. Tap a locked node → bubble with the locked line, no Başla; tap elsewhere → closes.
4. Tap node 1 → bubble with thumbnail/title/☆☆☆ → Başla → exercise opens (two taps total).
5. Score 2/3 → back on the map, node 1 is green with ⭐⭐☆ and node 2 now pulses blue.
   Score 1/3 on node 2 → it shows ⭐☆☆, stays current, node 3 stays locked.
6. Kill and relaunch → stars and unlocks persist (migration keeps pre-round-5 progress).
7. Airplane mode after 2 pages → banner + cached nodes scroll + no bottom spinner; states
   still correct (progress is local).
8. Switch language in Settings → titles and bubble copy switch; unlock states unchanged.
9. Reduced motion → current node wears the yellow ring, no pulsing; bubble appears instantly.
10. TalkBack: nodes announce "Ders N: {author}. kilitli/açık/yıldız 2/3"; the backdrop
    announces "Kapat".
11. Narrow screen + edges: on 360dp the ⭐ row under a completed node sits clear of the path
    line and never touches the next node's row; open a bubble on a node near the **bottom** of
    the viewport — it must flip above (or clamp) so "Başla" is always reachable, and the 🔊 next
    to the title stays inside the card.

## e) References

- FlatList: https://reactnative.dev/docs/flatlist
- Infinite queries: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- useInfiniteQuery: https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery
- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- zustand persist (version/migrate): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- React Query + React Native (onlineManager/NetInfo): https://tanstack.com/query/latest/docs/framework/react/react-native
- picsum.photos API: https://picsum.photos/
