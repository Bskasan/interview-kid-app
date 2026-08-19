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

## Features

_(none yet — added per phase)_
