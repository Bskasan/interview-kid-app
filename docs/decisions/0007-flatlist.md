# 0007 — FlatList for the Home lesson list

Status: accepted
Date: 2026-08-19

## Context

Home renders exactly 20 fixed-height cards. The list needs pull-to-refresh, stable keys and
smooth scrolling on a mid-range Android phone in Expo Go.

## Decision

React Native's built-in **FlatList** with `keyExtractor` (lesson id — deduplicated by the mapper,
ADR 0009), `getItemLayout` (cards have a fixed exported height, so layout is computed without
measurement), a `RefreshControl` bound to React Query's `refetch`, and a fixed header *outside*
the list so `getItemLayout` offsets stay exact.

## Alternatives considered

- **@shopify/flash-list** — better recycling for long/heterogeneous lists and it does run in Expo
  Go, but it is an extra dependency whose benefits appear at hundreds of items; for 20 fixed-height
  rows FlatList with `getItemLayout` already skips all measurement work. Not worth a dependency
  the interviewer will ask to justify.
- **ScrollView + map** — fine for 20 items memory-wise, but loses virtualization, `RefreshControl`
  conventions and item-level optimizations for free; FlatList costs nothing extra to use properly.

## Consequences

- List performance is deterministic (no measurement passes); `scrollToIndex` would also work
  reliably if ever needed.
- The fixed card height means very large system font scaling can truncate the title — revisited
  in the Phase 4 accessibility pass.
- At production scale (paginated content, images of varying aspect), FlashList + `estimatedItemSize`
  would be the switch, and the list would gain `onEndReached` pagination.

## References

- FlatList (keyExtractor, getItemLayout, refresh props): https://reactnative.dev/docs/flatlist
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
