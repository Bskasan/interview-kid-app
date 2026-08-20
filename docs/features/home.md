# Lesson list (Alıştırmalar tab)

Route: `app/(tabs)/exercises.tsx` — the scrollable lesson list inside the tab shell (see
shell.md for the shell itself).

## a) What the user sees

All copy is resolved from `src/locales/{tr,en}.json` at render time; Turkish is quoted here.

1. Header: big "Dersler" title and the fox mascot greeting "Merhaba! Hadi öğrenelim 🚀"
   (the language toggle lives on the Settings tab — see i18n.md).
2. While loading: five pulsing skeleton cards (static blocks if reduced motion is on).
3. Loaded: the fixed 20-lesson catalog arrives **10 at a time as the child scrolls** — 10 on
   entry, the last 10 when scrolling near the bottom. While the second page loads, a small
   spinner + "Daha fazla ders geliyor…" sits under the list; at the end of the catalog nothing
   extra is shown. Each card shows a rounded thumbnail,
   "Ders N: {author}" (N continues across pages: 1–10, 11–20, …), and a progress indicator — a
   star row (⭐ per correct answer of the best attempt, ☆ otherwise) plus, after a completed
   attempt, a pill: "Devam et 💪" (tried, no badge), "Rozet 🏅" (passed) or "Süper 🌟" (perfect).
4. Pressing a card bounces it, ticks a light haptic, and opens the Exercise screen for that
   lesson (a double-tap can never open it twice).
5. Pull down to refresh (green spinner): the already-loaded pages refetch in place; scroll
   position is kept.
6. Offline: a bordered banner "İnternet yok — kayıtlı dersler açık 📚" appears above the list;
   the cached pages stay scrollable and **no bottom spinner appears** (loading resumes on the
   next scroll once back online). Offline **without** any cached list: full-screen mascot
   message with "Tekrar dene". Other errors: "Bir şeyler ters gitti" + retry. Empty payload:
   "Henüz ders yok" + retry.

## b) How it works in code

- `src/api/lessons.ts` — `fetchLessonsPage(page)` GETs
  `https://picsum.photos/v2/list?page=N&limit=10` (composed from
  `PICSUM_BASE_URL`/`LESSONS_PAGE_SIZE` in `src/constants/api.ts`) with a 10 s `AbortController`
  timeout (`REQUEST_TIMEOUT_MS`, `src/constants/timing.ts`) and returns
  `{ lessons, page, isLastPage }` — `isLastPage` is judged on the **raw** array length so a page
  with skipped invalid items doesn't end pagination early. `mapLessons(data, page)` narrows the
  unknown payload into `Lesson[]` (skip bad items, dedupe ids within the page, numbering
  anchored to the page slot: `(page−1)×10 + index + 1` — the title itself composes at render
  time from `lessonNumber` + `author`, so cached data is language-neutral). The module also
  exports the pure pagination helpers: `nextLessonsPageParam` (hard-capped at
  `LESSONS_TOTAL_LIMIT` 20 → never requests past page 2), `flattenLessonPages` (cross-page
  dedupe, first occurrence wins) and `canLoadMoreLessons` (the onEndReached gate). Thumbnails
  use `https://picsum.photos/id/{id}/200/200` (`LESSON_THUMBNAIL_SIZE`).
- `src/hooks/useLessons.ts` — `useInfiniteQuery({ queryKey: ['lessons'] })` with
  `initialPageParam: LESSONS_FIRST_PAGE`, `getNextPageParam: nextLessonsPageParam` and
  `select: flattenLessonPages`, so screens receive a flat deduped `Lesson[]`. Defaults set in
  `app/_layout.tsx`: `staleTime` 5 min, `gcTime` 24 h, `retry` 2 (ADR 0041).
- `app/(tabs)/exercises.tsx` list wiring — `onEndReached` (threshold 0.5) calls
  `fetchNextPage({ cancelRefetch: false })` behind `canLoadMoreLessons` (not in flight, not at
  the end, not offline); `ListFooterComponent` renders the spinner row only while
  `isFetchingNextPage`; the `RefreshControl` spinner is gated `isRefetching &&
!isFetchingNextPage` because page appends also flip `isRefetching`.
- `app/_layout.tsx` — `PersistQueryClientProvider` + `createAsyncStoragePersister` persist the
  query cache to AsyncStorage (24 h `maxAge`, `buster: 'lessons-v3'` — bumped for the infinite
  `{pages, pageParams}` shape), so a cold start offline rehydrates every page loaded so far;
  `onlineManager` is fed by NetInfo so reconnect triggers refetch (ADR 0008).
- `src/hooks/useNetworkStatus.ts` — NetInfo subscription; offline only on definite negatives
  (`isConnected === false` or `isInternetReachable === false`), so the unknown initial state
  never flashes the banner.
- `src/components/LessonCard.tsx` — reads the zustand progress store with a selector
  (`results[lesson.id]`, gated on `hasHydrated`); derives the four states (ADR 0010); the
  pre-attempt star count comes from `QUESTIONS_PER_ATTEMPT` (`src/constants/quiz.ts`); exports
  `LESSON_CARD_HEIGHT`/`LESSON_CARD_GAP`/`LESSON_CARD_THUMB_SIZE` so the FlatList
  `getItemLayout` never measures and the skeleton matches. Press physics come from
  `src/hooks/usePressFeedback.ts` (scale spring + haptic, reduced-motion aware).
- `app/(tabs)/exercises.tsx` — decides between skeletons / list / full-screen message. The list renders
  whenever data exists, even if the latest refetch failed (React Query keeps `data` on error);
  the full-screen error appears only with no data at all. `RefreshControl` maps `isRefetching` /
  `refetch`. Header sits outside the FlatList so `getItemLayout` offsets stay exact (ADR 0007).
  Card taps go through `useNavigationLock({ resetOnFocus: true })`: one navigation per focus,
  re-armed when Home regains focus.
- `src/store/progressStore.ts` — zustand + persist (AsyncStorage). `recordResult` delegates the
  best-attempt merge to `mergeResult` in `src/lib/scoring.ts` (unit-tested); `hasHydrated` flips
  after rehydration so the UI can tell "no progress" from "not loaded yet".

## c) Edge cases handled

- Malformed API payload or items → skipped/empty, never a crash; empty state with retry.
- Duplicate ids from the API → deduplicated within a page **and across page boundaries** (first
  occurrence wins), so FlatList keys stay unique.
- A full raw page whose items partly fail validation → still pages on (end-of-list is judged on
  the raw length, not the mapped length); an empty or non-array payload ends the list instead
  of looping.
- FlatList's known repeated `onEndReached` firing → pure gate + `cancelRefetch: false` make
  duplicates no-ops; VirtualizedList itself also fires once per content length.
- Offline while scrolling → no `fetchNextPage`, no stranded footer spinner; loading resumes
  after reconnect on the next scroll.
- picsum could serve hundreds of pages → the pager is hard-capped at the 20-lesson catalog
  (`LESSONS_TOTAL_LIMIT`); page 2 is never exceeded no matter how the API behaves.
- A failed page request → that page errors (retry ×2), already-loaded pages stay on screen.
- Request hangs → aborted at 10 s, standard error/retry path.
- Offline cold start with cache → cached pages + banner; without cache → offline-specific message.
- Refetch failure while data on screen → cached list stays, no jarring error swap.
- Shaky/unknown connectivity at startup → no false offline banner (definite-negative rule).
- Store not yet rehydrated → neutral progress visuals; a11y label matches what is shown.
- Fast double-tap on a card → the navigation lock lets only the first tap through.
- Reduced motion → skeleton pulse and press bounce disabled.

## d) Manual test steps

1. Fresh start online → skeletons, then 10 cards with images; scrolling near the bottom shows
   the footer spinner + "Daha fazla ders geliyor…" and appends the next 10 ("Ders 11" continues
   the numbering). A fast fling to the bottom loads one page, not several.
2. Tap a card → the lesson's video stage opens; 🏠 (or back) raises the exit sheet and
   "Alıştırmalara dön" returns to this tab.
3. Pull to refresh → green spinner at the top (never during a page append), list settles in
   place.
4. Airplane mode ON after loading ~2 pages → banner appears; the loaded cards still scroll and
   **no footer spinner appears at the bottom**; airplane OFF → next scroll loads more again,
   stale pages silently refetch.
5. Force-close app, airplane mode ON, reopen → cached list + banner (persistence proof).
6. Clear Expo Go's data (or uninstall/reinstall), airplane mode ON, open → full-screen offline
   message with retry; disable airplane mode, tap "Tekrar dene" → list loads.
7. TalkBack: a card announces "Ders N: author. Henüz denenmedi" (or the earned status).

## e) References

- FlatList (onEndReached/onStartReached): https://reactnative.dev/docs/flatlist
- Infinite queries: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- useInfiniteQuery: https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
- React Query + React Native (onlineManager/NetInfo): https://tanstack.com/query/latest/docs/framework/react/react-native
- persistQueryClient: https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- createAsyncStoragePersister: https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister
- NetInfo in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/netinfo/
- AsyncStorage in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/
- zustand persist middleware: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- picsum.photos API: https://picsum.photos/
- AsyncStorage Jest mock — official async-storage docs page "Jest integration" (unverified link —
  the docs site was unreachable at review time; the mock path used is
  `@react-native-async-storage/async-storage/jest/async-storage-mock`)
