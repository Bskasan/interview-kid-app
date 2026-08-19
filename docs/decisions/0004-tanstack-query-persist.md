# 0004 — TanStack Query + AsyncStorage persistence for server data

Status: accepted
Date: 2026-08-19

## Context

The Home lesson list must come from the network (picsum.photos) and must handle loading, error
with retry, empty, and offline states. Assumption #5 requires an offline cache: offline **with**
a previous load shows the list plus a banner; offline **without** cache shows an error with retry.
Hand-rolling caching + persistence + retry around `fetch` is exactly the kind of edge-case-prone
code this assignment penalizes.

## Decision

Use **@tanstack/react-query** for all server state, with
**@tanstack/react-query-persist-client** + **@tanstack/query-async-storage-persister** writing the
query cache to AsyncStorage. `PersistQueryClientProvider` wraps the app in `app/_layout.tsx`, so a
cold start offline restores the last successful lesson list automatically.

## Alternatives considered

- **fetch + useState/useEffect** — no dependency, but we would hand-write caching, deduping,
  retry, refresh, and AsyncStorage persistence with hydration races. Many edge cases, zero leverage.
- **SWR** — lighter API, but cache persistence to AsyncStorage has no first-class plugin; we would
  write a custom cache provider synced to storage — the exact code we are trying not to own.
- **RTK Query** — capable, but drags in a Redux store and slice/api boilerplate for a single
  endpoint; offline persistence would add redux-persist on top. Oversized for one list.

## Consequences

- Loading/error/retry/pull-to-refresh become declarative query state instead of custom code.
- Offline-first-load behavior comes from the persister; we only add a NetInfo banner.
- Two extra small dependencies; cache versioning (`buster`) and `maxAge` need conscious values at
  production scale, and mutations/invalidations would need a real strategy beyond this scope.

## References

- persistQueryClient / PersistQueryClientProvider: https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
- createAsyncStoragePersister: https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister
- AsyncStorage in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/
- NetInfo in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/netinfo/
