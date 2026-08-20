# Error handling — central, kid-friendly, no technical details

## What the user sees

1. Most failures change nothing visible: the screen the child is on already shows the
   friendly state (Home's retry screen, the video's "no problem" path, an emoji standing in
   for a broken photo). These are logged, not announced.
2. When something with no dedicated UI goes wrong (saving progress failed, corrupted
   storage on launch), a calm banner slides in under the status bar: the fox, one short
   translated sentence ("Kaydederken bir sorun oldu"), a big "Tamam", and — for call sites
   that pass a `retry` action (none currently do) — a "Tekrar dene" button. Never an error code, URL, stack trace or
   library name. A new problem replaces the banner text; banners never stack.
3. If a screen crashes outright, instead of a red screen the child gets a full-screen
   fallback: the fox, "Bir şeyler ters gitti", and one big "Ana Sayfa" button that goes
   somewhere safe. Everything is translated (tr/en) like the rest of the app.

## How it works in code

- **`src/lib/errors/types.ts`** — `AppError`: plain discriminated object
  `{ kind: 'AppError', code: NETWORK|MEDIA|STORAGE|UNKNOWN, userMessageKey, retry?, cause? }`
  - `createAppError` / `isAppError`. `userMessageKey` is typed to the `errors.*` namespace.
- **`src/lib/errors/normalize.ts`** — `normalizeError(unknown, code?)`: AppError passes
  through; explicit code wins; `AbortError` and RN's fetch `TypeError` (message matching
  `/network request failed/i`) → NETWORK; else UNKNOWN. The original value rides along as `cause` for the logger only.
- **`src/lib/errors/handleError.ts`** — the funnel: normalize → `logger.error(context,...)`
  always → `errorStore.show` unless `severity: 'silent'`. Returns the AppError for callers
  with their own failure UI.
- **`src/lib/logger.ts`** — the only file allowed to touch `console` (repo-wide
  `no-console: error`; file-level justified disable). Dev-only output; the prod branch is a
  no-op with an explicit crash-reporter hook point.
- **`src/store/errorStore.ts`** — single current-error slot, replace-on-new, not persisted.
- **`src/components/GlobalErrorBanner.tsx`** — mounted once in `app/_layout.tsx`; renders
  the translated message + Tamam + optional retry; spring slide-in, instant under reduced
  motion; `accessibilityLiveRegion="polite"`. Falls back to the hardcoded Turkish lines in
  `src/lib/errors/fallbackText.ts` if i18next itself is down (the one audit exception); the
  fox glyph comes from the exported `MASCOT_FACE` so the face can never fork.
- **`app/_layout.tsx`** — `QueryCache({ onError })` reports every query failure (silent —
  Home owns that UI); the persister uses `reportingStorage`; `export function
ErrorBoundary({ error, retry })` (Expo Router convention) renders the crash fallback and
  reports via `handleError`.
- **`src/lib/storage.ts`** — `reportingStorage`: AsyncStorage wrapper used by the query
  persister and both zustand stores. Reads fail silent → `null` (neutral UI states are
  correct); writes fail notify (STORAGE banner).
- **Stores** — `progressStore`/`settingsStore` `onRehydrateStorage` now receive the error
  argument: corrupt progress JSON → notify (badges may look wiped); corrupt settings →
  silent (device language simply applies).
- **Media** — `ExerciseVideo` forwards the `statusChange` error payload
  (`onError(cause)`); the exercise screen logs MEDIA silent and keeps its own failure UI.
  `LessonCard` thumbnails, `AnswerTile` images and the `ExitConfirmSheet` thumbnail log
  MEDIA silent; their fallbacks (bordered placeholder / emoji) remain the visible behavior.

## Edge cases handled

- Failed lessons fetch: logged once centrally (QueryCache), UI unchanged — full-screen
  retry without data, silent cached-data retention on background refetch.
- Storage write failure: banner (progress might not survive restart) — the in-memory state
  keeps working.
- Corrupt persisted progress: rehydrate error → banner; `hasHydrated` still flips so the
  UI never hangs on skeletons.
- i18n init failure: reported; banner/boundary render the hardcoded Turkish fallback
  instead of raw keys.
- Error while the banner is already up: replaces it (single slot) — the log keeps both.
- Reduced motion: banner appears without animation.

## How to test manually

1. Airplane mode, cold start (no cache): Home shows the retry screen; Metro console logs
   one `[query.lessons] NETWORK …` line per failed query (after its 2 retries settle);
   **no banner** (silent policy).
2. Simulate a storage write failure (dev): temporarily make `reportingStorage.setItem`
   throw, finish a quiz → banner "Kaydederken bir sorun oldu" with Tamam; toggle language
   to English → the same flow shows "Something went wrong while saving".
3. Corrupt rehydrate (dev): with the app killed, write invalid JSON under the
   `progress-v1` AsyncStorage key (or temporarily hack `getItem` to return `"{"`), launch →
   banner appears, Home still renders with neutral progress.
4. Crash fallback (dev): throw inside a screen render → fox + "Bir şeyler ters gitti" +
   "Ana Sayfa" instead of a red screen; the button lands on the dashboard.
5. Break an answer-photo URL (dev): the tile falls back to 🐶 and logs `[answer-tile.image]`;
   no banner.

## References

- TanStack QueryCache onError: https://tanstack.com/query/latest/docs/reference/QueryCache
- Expo Router error handling (ErrorBoundary): https://docs.expo.dev/router/error-handling/
- zustand persist (onRehydrateStorage): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- expo-video statusChange event: https://docs.expo.dev/versions/latest/sdk/video/
- expo-image onError: https://docs.expo.dev/versions/latest/sdk/image/
