# CLAUDE.md — Kids Learning App (take-home assignment)

This file defines the non-negotiable conventions for this repo. Read it before every task.

## What this project is

A small React Native (Expo) take-home: a gamified learning flow for young children with three connected
screens — Home (lesson list from a public API) → Exercise (short video + timed multiple-choice quiz) →
Result (pass/fail + animated badge). Scope is ~1–2 days of focused work. Evaluators care about
**decisions, edge-case handling and clarity**, not visual polish.

## Hard constraints

- **Expo managed workflow, must run in Expo Go** (developer is on Windows, tests on a physical Android
  phone; iOS is untested). Do not add any library that requires a custom dev client or native config
  changes. Before adding a dependency, confirm it is Expo Go–compatible.
- **Never use `expo-av`.** It is deprecated and removed from the SDK. Use `expo-video` for video
  (`useVideoPlayer` + `<VideoView>`). If audio is ever needed, use `expo-audio`.
- Install dependencies with `npx expo install <pkg>` (SDK-pinned versions), never plain `npm install`
  for Expo/RN packages.
- TypeScript everywhere, `strict: true`. No `any` unless justified with a comment.
- Home data must come from the network (picsum.photos). Exercise questions are local mock data.

## Stack (fixed — do not swap without asking)

- Expo (latest SDK, default template) + Expo Router (file-based routes under `app/`)
- `@tanstack/react-query` for server data, persisted to AsyncStorage for offline cache
- `zustand` (+ `persist` middleware with AsyncStorage) for user progress/badges
- `expo-video`, `expo-image`, `react-native-reanimated`, `react-native-safe-area-context`
- `@react-native-community/netinfo` for online/offline state
- Jest via `jest-expo` + `@testing-library/react-native`

## Project layout

```
app/                 # routes only — thin screens that compose components/hooks
  _layout.tsx        # providers (QueryClient + persistence, SafeArea), Stack
  index.tsx          # Home
  exercise/[id].tsx  # Exercise
  result.tsx         # Result (params: lessonId, correct, total)
src/
  api/               # fetchers + mappers (picsum → Lesson)
  components/        # presentational, reusable UI
  data/              # mock questions
  hooks/             # useCountdown, useNetworkStatus, etc.
  lib/               # pure logic (scoring, badge rules) — unit-tested
  store/             # zustand stores
  theme/             # colors, spacing, typography tokens
  types/             # shared types
__tests__/           # mirrors src/
```

## Code conventions

- Code, comments and commit messages in **English**. All **user-facing strings in Turkish** (target users
  are Turkish children). Keep strings in one `src/lib/strings.ts` so they are easy to review/translate.
- Pure logic (scoring, pass threshold, badge level, timer math) lives in `src/lib` and has unit tests.
  Screens stay thin.
- Every async/remote state handles: loading, error (with retry), empty, offline. No silent failures.
- Touch targets ≥ 48dp (kids!), `accessibilityRole`/`accessibilityLabel` on interactive elements,
  respect reduced-motion (`useReducedMotion` from reanimated) for the badge animation.
- Minimal, readable styling with `StyleSheet` + theme tokens. No UI kit.
- Small, logical **conventional commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). One concern per
  commit. Commit after each phase — the git history is part of what gets evaluated.

## Definition of done for any task

- `npx tsc --noEmit` passes
- `npm test` passes
- `npx expo-doctor` reports no issues (or you explain why)
- You tell the developer exactly what to verify manually on the device (they run Expo Go, you cannot)

## Decisions already made (see README "Assumptions")

These are deliberate; implement them as specified and document them in README, don't re-litigate:

1. "Alıştırmaya Geç" is enabled only after the video **ends**. If the video fails to load or errors, show
   a friendly message and enable the button anyway (media must never block the flow).
2. Quiz: 3 multiple-choice questions per lesson, **15 s per question**. Timeout = counted as wrong,
   auto-advance. Timer **pauses** when app goes to background (AppState) and resumes on foreground.
3. Pass threshold: **≥ 2/3 correct**. 3/3 = "perfect" badge, 2/3 = normal badge, <2 = no badge, retry
   allowed. Retaking a lesson keeps the **best** result.
4. Leaving the exercise mid-way (back gesture/button) asks for confirmation; progress of that attempt is
   discarded. Home progress reflects only completed attempts.
5. Home list: 20 items from `https://picsum.photos/v2/list?page=1&limit=20`; title is generated
   ("Ders N: {author}"); thumbnail `https://picsum.photos/id/{id}/200/200`. Cached for offline; when
   offline with cache → show list + banner; offline without cache → error state with retry.
