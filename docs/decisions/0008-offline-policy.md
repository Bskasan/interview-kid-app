# 0008 — Offline policy for the Home list

Status: accepted
Date: 2026-08-19

## Context

Assumption #5: after a successful load, the lesson list must work offline (list + banner);
offline **without** any cached data shows an error state with retry. A kids app also should not
flash "no internet" warnings on shaky signal, and it should recover by itself when the
connection returns.

## Decision

Three cooperating pieces:

1. **Cache persistence** — the React Query cache is persisted to AsyncStorage via
   `PersistQueryClientProvider` + `createAsyncStoragePersister` (`maxAge` 24 h, `buster`
   `lessons-v1` — bumped to `lessons-v2` by 0029 and to `lessons-v3` by 0041's infinite-pages
   shape, query `gcTime` ≥ `maxAge`). A cold start offline rehydrates the last good list — since
   0041, up to `maxPages` previously loaded pages.
2. **Connectivity awareness** — React Query's `onlineManager` is driven by NetInfo (per the
   official React Native guide), so a stale list refetches automatically on reconnect.
3. **Honest banner** — `useNetworkStatus` reports offline only on a _definite_ negative
   (`isConnected === false` or `isInternetReachable === false`). NetInfo's initial `null`
   ("don't know yet") is treated as online, so the banner never flashes during startup.

Failed background refetches keep showing cached data (React Query keeps `data` on error);
the full-screen error appears only when there is nothing to show at all.

## Alternatives considered

- **No persistence (memory cache only)** — simplest, but violates the assumption: cold start
  offline would always error even for a returning user.
- **Hand-rolled AsyncStorage cache next to fetch** — reimplements what the persister does
  (serialization, maxAge, hydration timing, invalidation) with more edge cases and no tests
  behind it.
- **Local database (SQLite/WatermelonDB) offline-first sync** — the production-grade answer for
  real content, but wildly oversized for one read-only list of 20 items.

## Consequences

- Users can see up to 24 h-old lessons offline — acceptable for placeholder content; a real app
  would tune `maxAge`/`staleTime` per content type and add background revalidation UX.
- The `buster` string must be bumped whenever the Lesson shape changes, or hydration would
  restore incompatible data.
- Airplane-mode transitions need no manual refresh: reconnect triggers a refetch because the
  query is marked stale after 5 minutes.

## References

- React Query on React Native (onlineManager + NetInfo): https://tanstack.com/query/latest/docs/framework/react/react-native
- persistQueryClient / PersistQueryClientProvider: https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- createAsyncStoragePersister: https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister
- NetInfo in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/netinfo/
