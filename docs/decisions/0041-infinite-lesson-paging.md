# 0041 — Infinite lesson paging for the Home list

Status: accepted
Date: 2026-08-20

## Context

The Home list fetched exactly one page (`?page=1&limit=20`) in a single request. FlatList's
virtualization bounds _rendering_, but nothing bounded network or image loading, and the app
could never show more than 20 lessons. Round 5 asks the list to scale to hundreds of lessons,
loading incrementally as the child scrolls, while keeping every existing guarantee: defensive
parsing (0009), offline cache + banner (0008), locale-neutral cached data (0029) and stable
"Ders N" numbering.

## Decision

Convert the data layer to **React Query `useInfiniteQuery`** over picsum's real `?page=N&limit=M`
paging, with a page size of **10** and these rules:

- `fetchLessonsPage(page)` returns `{ lessons, page, isLastPage }`. **End-of-list is judged on
  the RAW array length** (`< LESSONS_PAGE_SIZE`) _before_ validation: a full page whose items
  partly fail validation must not end pagination early, and a non-array payload ends the list
  instead of looping. `getNextPageParam` returns `page + 1` until `isLastPage`.
- **Numbering is anchored to the page slot**: `Ders N = (page − 1) × pageSize + indexAmongValid + 1`,
  computed in the mapper. Numbers never shift when other pages load, refetch or drop out of the
  cache window; a skipped invalid item shifts numbers only inside its own page (a cross-page gap
  is possible and accepted — disclosed here rather than renumbering the whole list client-side).
- **Cross-page dedupe** in a `select`-level flatten (`flattenLessonPages`): picsum can repeat an
  id at page boundaries; the first occurrence wins so FlatList keys stay unique.
- **`maxPages: 5`** caps memory and the persisted cache at 50 lessons. Justification: AsyncStorage
  persistence (0008) would otherwise grow unbounded; 50 lessons is far beyond what a child clears
  in a session. Consequence: loading page 6 drops page 1 from the window. Mitigation:
  `getPreviousPageParam` (required by React Query when `maxPages` is set) plus FlatList
  `onStartReached → fetchPreviousPage` refills dropped front pages when scrolling back up.
- **Multi-fire guard** for FlatList's known repeated `onEndReached` firing is two independent
  layers: a pure `canLoadMoreLessons({hasNextPage, isFetchingNextPage, isOffline})` gate, and
  `fetchNextPage({ cancelRefetch: false })` so a duplicate call while a page request is in
  flight is a no-op instead of a cancel-and-restart (React Query's default is `true`).
  VirtualizedList itself also fires `onEndReached` at most once per content length.
- **Offline**: the same gate blocks `fetchNextPage` while offline, so the footer spinner can
  never strand (a fetch started offline would just pause in React Query). Cached pages render
  under the existing banner; reconnection resumes loading on the next scroll.
- **Footer**: small spinner + translated "loading more" line only while `isFetchingNextPage`;
  nothing at the true end of the list (no end-of-list message for kids), nothing offline.
- **Pull-to-refresh** calls `refetch()` on the infinite query, which refetches the cached pages
  (≤ 5 sequential requests) and keeps scroll position — resetting to one page would yank the
  list out from under the child's thumb. The `RefreshControl` spinner is gated with
  `isRefetching && !isFetchingNextPage` because `isRefetching` is also true during page appends.
- **Persistence buster** bumps `lessons-v2 → lessons-v3`: the persisted shape changed from
  `Lesson[]` to `InfiniteData<{pages, pageParams}>` (rule from 0008).

## Alternatives considered

- **Keep the one-shot fetch (larger limit)** — no scroll-driven loading, unbounded initial
  network cost, and it caps the catalog at whatever limit is baked in; exactly what this round
  removes.
- **Manual page state (useState + useQuery per page)** — reimplements what `useInfiniteQuery`
  ships tested: page-param bookkeeping, in-flight dedupe, persisted `InfiniteData`, `maxPages`
  windowing. More code, more edge cases, no benefit.
- **FlashList** — re-evaluated from 0007: recycling would help at hundreds of _rendered_ rows,
  but rows are fixed-height (`getItemLayout` already skips measurement) and `maxPages` caps the
  in-memory list at 50 items, so the recycling win never materializes; still not worth a new
  dependency.
- **`onEndReached` momentum-flag guard** (ref reset in `onMomentumScrollBegin`) — the classic
  workaround; rejected because it adds mutable UI state for what the query layer already
  guarantees (`cancelRefetch: false`), and it silently blocks legitimate loads when the child
  holds the list at the bottom without starting a new drag.

## Consequences

- The list now scales to picsum's full catalog; initial load shrinks from 20 to 10 items.
- Two more query round-trips per 20 lessons compared to the old single fetch — the price of
  bounded loading.
- Scrolling past 50 lessons drops the earliest pages from the window; scrolling back refills
  them via `onStartReached` (a brief skeleton-free gap is possible on very fast upward flings).
- The persisted cache now restores up to 5 pages; the buster bump discards every pre-round-5
  cache once.
- The exercise flow is untouched: it reads only the route id (0034), and progress is keyed by
  lesson id, so pagination cannot corrupt recorded results.

## References

- Infinite queries (maxPages, getNextPageParam, cancelRefetch):
  https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- useInfiniteQuery reference:
  https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery
- FlatList (onEndReached, onStartReached, getItemLayout): https://reactnative.dev/docs/flatlist
- persistQueryClient (buster): https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- picsum.photos API (paging): https://picsum.photos/
