# Home screen

Route: `app/index.tsx` — the lesson list a child lands on.

## a) What the user sees

1. Header: big "Dersler" title and the fox mascot greeting "Merhaba! Hadi öğrenelim 🚀".
2. While loading: five pulsing skeleton cards (static blocks if reduced motion is on).
3. Loaded: 20 lesson cards. Each card shows a rounded thumbnail, "Ders N: {author}", and a
   progress indicator — a star row (⭐ per correct answer of the best attempt, ☆ otherwise) plus,
   after a completed attempt, a pill: "Devam et 💪" (tried, no badge), "Rozet 🏅" (passed) or
   "Süper 🌟" (perfect).
4. Pressing a card bounces it, ticks a light haptic, and opens the Exercise screen for that
   lesson (a friendly placeholder until Phase 2).
5. Pull down to refresh the list (green spinner).
6. Offline: a bordered banner "İnternet yok — kayıtlı dersler açık 📚" appears above the list.
   Offline **without** any cached list: full-screen mascot message with "Tekrar dene". Other
   errors: "Bir şeyler ters gitti" + retry. Empty payload: "Henüz ders yok" + retry.

## b) How it works in code

- `src/api/lessons.ts` — `fetchLessons` GETs `https://picsum.photos/v2/list?page=1&limit=20`
  with a 10 s `AbortController` timeout, then `mapLessons` narrows the unknown payload into
  `Lesson[]` (skip bad items, dedupe ids, contiguous "Ders N" numbering — ADR 0009). Thumbnails
  use `https://picsum.photos/id/{id}/200/200`.
- `src/hooks/useLessons.ts` — `useQuery({ queryKey: ['lessons'] })`. Defaults set in
  `app/_layout.tsx`: `staleTime` 5 min, `gcTime` 24 h, `retry` 2.
- `app/_layout.tsx` — `PersistQueryClientProvider` + `createAsyncStoragePersister` persist the
  query cache to AsyncStorage (24 h `maxAge`, `buster: 'lessons-v1'`), so a cold start offline
  rehydrates the last good list; `onlineManager` is fed by NetInfo so reconnect triggers refetch
  (ADR 0008).
- `src/hooks/useNetworkStatus.ts` — NetInfo subscription; offline only on definite negatives
  (`isConnected === false` or `isInternetReachable === false`), so the unknown initial state
  never flashes the banner.
- `src/components/LessonCard.tsx` — reads the zustand progress store with a selector
  (`results[lesson.id]`, gated on `hasHydrated`); derives the four states (ADR 0010); exports
  `LESSON_CARD_HEIGHT`/`LESSON_CARD_GAP` so the FlatList `getItemLayout` never measures.
  Press physics come from `src/hooks/usePressFeedback.ts` (scale spring + haptic, reduced-motion
  aware).
- `app/index.tsx` — decides between skeletons / list / full-screen message. The list renders
  whenever data exists, even if the latest refetch failed (React Query keeps `data` on error);
  the full-screen error appears only with no data at all. `RefreshControl` maps `isRefetching` /
  `refetch`. Header sits outside the FlatList so `getItemLayout` offsets stay exact (ADR 0007).
- `src/store/progressStore.ts` — zustand + persist (AsyncStorage). `recordResult` delegates the
  best-attempt merge to `mergeResult` in `src/lib/scoring.ts` (unit-tested); `hasHydrated` flips
  after rehydration so the UI can tell "no progress" from "not loaded yet".

## c) Edge cases handled

- Malformed API payload or items → skipped/empty, never a crash; empty state with retry.
- Duplicate ids from the API → deduplicated (stable FlatList keys).
- Request hangs → aborted at 10 s, standard error/retry path.
- Offline cold start with cache → list + banner; without cache → offline-specific message.
- Refetch failure while data on screen → cached list stays, no jarring error swap.
- Shaky/unknown connectivity at startup → no false offline banner (definite-negative rule).
- Store not yet rehydrated → neutral progress visuals; a11y label matches what is shown.
- Reduced motion → skeleton pulse and press bounce disabled.

## d) Manual test steps

1. Fresh start online → skeletons, then 20 cards with images; scroll is smooth.
2. Tap a card → placeholder exercise screen shows the same lesson id (📚 caption); "Geri" returns.
3. Pull to refresh → green spinner, list settles.
4. Airplane mode ON (app open) → banner appears; list still scrolls; pull-to-refresh keeps the
   list; airplane OFF → banner disappears, list silently refetches when stale.
5. Force-close app, airplane mode ON, reopen → cached list + banner (persistence proof).
6. Clear Expo Go's data (or uninstall/reinstall), airplane mode ON, open → full-screen offline
   message with retry; disable airplane mode, tap "Tekrar dene" → list loads.
7. TalkBack: a card announces "Ders N: author. Henüz denenmedi" (or the earned status).

## e) References

- FlatList: https://reactnative.dev/docs/flatlist
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
