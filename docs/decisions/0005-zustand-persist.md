# 0005 — zustand + persist for user progress

Status: accepted
Date: 2026-08-19

## Context

Per-lesson progress (best score, badge level) must survive app restarts, be written once per
completed attempt (Result screen) and read by every Home card. It is client-owned state, distinct
from server data (0004), and tiny: one record per lesson.

## Decision

Use **zustand** with the **persist** middleware over AsyncStorage (`createJSONStorage`).
One small store (`src/store/progressStore.ts`) exposes `results` and a `recordResult()` action
that keeps the best attempt. Components subscribe with selectors, so a badge update re-renders
only the affected card.

## Alternatives considered

- **React Context + useReducer** — adequate for this size, but persistence + hydration
  (AsyncStorage read/write, JSON versioning) becomes hand-rolled code, and every consumer
  re-renders on any state change unless we split contexts manually.
- **Redux Toolkit (+ redux-persist)** — store, slices, provider, middleware config… heavy ceremony
  for a single record map; redux-persist adds its own rehydration lifecycle to manage.
- **react-native-mmkv for storage** — much faster than AsyncStorage, but it is a native module not
  included in Expo Go, so it would break the hard constraint in 0001. AsyncStorage speed is
  irrelevant at "one small JSON object" scale.

## Consequences

- Progress store is a few lines, testable in plain Jest (no provider wrappers needed).
- AsyncStorage hydration is asynchronous: on cold start the store may render before rehydration;
  the Home screen must tolerate a brief "no badge yet" frame (handled when the store lands in
  Phase 1).
- The best-result merge policy (assumption #3) lives in the store/`src/lib`, unit-tested.

## References

- zustand persist middleware (official docs source): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
  — rendered docs-site page "persist middleware" (unverified link — the docs site renders client-side and could not be fetch-verified)
- AsyncStorage in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/
