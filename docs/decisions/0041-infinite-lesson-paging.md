# 0041 — Infinite lesson paging for the Home list

Status: accepted
Date: 2026-08-20

## Context

The Home list fetched exactly one page (`?page=1&limit=20`) in a single request: the whole
catalog's network and image loading started up front (FlatList's virtualization bounds
_rendering_ only). The course itself stays a **fixed 20-lesson catalog** — the brief asks for
15–20 items, and the round-5 level map builds a finite, sequentially unlocked lesson path on top
of it — but loading should become incremental: fetch 10 first, fetch the remaining 10 only when
the child scrolls, while keeping every existing guarantee: defensive parsing (0009), offline
cache + banner (0008), locale-neutral cached data (0029) and stable "Ders N" numbering.

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
- **Hard catalog cap** (`LESSONS_TOTAL_LIMIT = 20` → at most 2 pages): `getNextPageParam` never
  returns a page past the cap, even though picsum could serve hundreds. The cap — not React
  Query's `maxPages` windowing — is what bounds memory and AsyncStorage (≤ 20 items), so no
  window ever drops pages and no backward refill machinery is needed.
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
- **Unbounded paging over picsum's full catalog** (`maxPages` windowing + `getPreviousPageParam`
  backward refill) — built first, then removed on the product ruling that the app is a 20-lesson
  course, not an endless feed: under a 2-page cap the windowing can never trigger, and the
  page-drop/refill machinery (plus its "list shrinks at the top" edge case) is pure dead weight.
- **FlashList** — re-evaluated from 0007: recycling would help at hundreds of _rendered_ rows,
  but rows are fixed-height (`getItemLayout` already skips measurement) and the catalog caps the
  in-memory list at 20 items, so the recycling win never materializes; still not worth a new
  dependency.
- **`onEndReached` momentum-flag guard** (ref reset in `onMomentumScrollBegin`) — the classic
  workaround; rejected because it adds mutable UI state for what the query layer already
  guarantees (`cancelRefetch: false`), and it silently blocks legitimate loads when the child
  holds the list at the bottom without starting a new drag.

## Consequences

- Initial load shrinks from 20 to 10 items; the second (and last) page loads only when the
  child actually scrolls — two requests total instead of one bigger one.
- Raising the catalog later is a one-constant change (`LESSONS_TOTAL_LIMIT`); the pager, mapper
  numbering, dedupe and offline behaviour already handle any page count. At a truly unbounded
  scale, React Query's `maxPages` windowing (+ `getPreviousPageParam` refill) is the documented
  next step — deliberately not carried as dead code under the cap.
- The persisted cache now restores both pages; the buster bump discards every pre-round-5
  cache once.
- The exercise flow is untouched: it reads only the route id (0034), and progress is keyed by
  lesson id, so pagination cannot corrupt recorded results.

## References

- Infinite queries (getNextPageParam, cancelRefetch, maxPages):
  https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- useInfiniteQuery reference:
  https://tanstack.com/query/latest/docs/framework/react/reference/useInfiniteQuery
- FlatList (onEndReached, getItemLayout): https://reactnative.dev/docs/flatlist
- persistQueryClient (buster): https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- picsum.photos API (paging): https://picsum.photos/
