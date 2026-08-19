# Docs index

Decision records (ADRs) and feature docs for the Kids Learning App take-home.
Every non-obvious choice has a decision record; every screen/feature has a feature doc.

## Decisions

- [0001 — Expo managed workflow + Expo Go](decisions/0001-expo-managed-expo-go.md) — why managed Expo instead of bare RN or a custom dev client.
- [0002 — Expo Router](decisions/0002-expo-router.md) — file-based routing under root `app/` instead of using React Navigation directly.
- [0003 — expo-video](decisions/0003-expo-video.md) — current SDK video module; expo-av is deprecated/banned, react-native-video breaks Expo Go.
- [0004 — TanStack Query + persistence](decisions/0004-tanstack-query-persist.md) — declarative server state with AsyncStorage cache for the offline Home list.
- [0005 — zustand + persist](decisions/0005-zustand-persist.md) — tiny persisted progress/badge store; MMKV rejected (not Expo Go compatible).
- [0006 — Design language implementation](decisions/0006-design-language.md) — hand-rolled tokens + ChunkyButton + emoji mascot; UI kits, Lottie and Nunito rejected; contrast policy.
- [0007 — FlatList](decisions/0007-flatlist.md) — built-in FlatList with getItemLayout over FlashList for 20 fixed-height cards.
- [0008 — Offline policy](decisions/0008-offline-policy.md) — persisted query cache + NetInfo-driven banner/refetch; honest offline detection.
- [0009 — Defensive API parsing](decisions/0009-defensive-api-parsing.md) — hand-rolled unknown-narrowing mapper; skip bad items, never crash.
- [0010 — Progress indicator semantics](decisions/0010-progress-indicator.md) — stars = best score, status pill with icon+text, derived "attempted".
- [0011 — Web output "single"](decisions/0011-web-output-single.md) — no Node static rendering; fixes the window-is-not-defined SSR crash, web stays incidental.
- [0012 — Event-driven video stage](decisions/0012-expo-video-events.md) — playToEnd/statusChange unlock the quiz CTA; no polling, error never blocks the flow.
- [0013 — Timer policy](decisions/0013-timer-policy.md) — timestamp-based countdown, AppState pause/resume, single-fire expiry.
- [0014 — Quiz back guard](decisions/0014-back-guard.md) — usePreventRemove + native Alert; finish disables the guard before replacing to Result.
- [0015 — Question assignment](decisions/0015-question-assignment.md) — deterministic set per lesson id, pure quiz state machine, double-tap guard.

## Features

- [Home](features/home.md) — lesson list: data flow, offline behavior, progress indicators, edge cases, manual tests.
- [Exercise](features/exercise.md) — video stage + timed quiz: events, timer, back guard, feedback states, edge cases, manual tests.
