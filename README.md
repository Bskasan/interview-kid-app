# Kids Learning App — Mini Flow

A small gamified learning flow for children (~5–8), built as a take-home assignment with
React Native + Expo. Three connected screens:

**Home** (lesson list from a public API, with progress badges) → **Exercise** (short video +
timed 3-question quiz) → **Result** (pass/fail celebration with an animated badge).

The evaluation focus is decisions, edge cases and clarity — every non-obvious choice has a
decision record in [`docs/`](docs/README.md).

## How to run (Windows + Android)

Prerequisites: Node 20+, an Android phone with the latest **Expo Go** from the Play Store
(Expo Go only supports the newest SDK — this project is on SDK 57), or an Android emulator.

```bash
npm install
npx expo start
```

- **Physical phone**: scan the QR with Expo Go (phone and PC on the same Wi-Fi).
- **Emulator**: press `a` in the Expo CLI (requires Android Studio + a running/creatable AVD).
- **Firewall/hotel Wi-Fi problems**: `npx expo start --tunnel` (slower, but always reaches the
  phone).

Checks: `npm test` (Jest, 44 tests) · `npx tsc --noEmit` · `npx expo-doctor`.
Note: Expo Router's *typed routes* are generated into `.expo/` by the dev server — on a fresh
clone run `npx expo start` once before `npx tsc --noEmit`.

## Architecture overview

Routes under `app/` are thin screens that compose everything from `src/`: server data flows
through TanStack Query (persisted to AsyncStorage for offline), user progress lives in a
persisted zustand store, and all pure logic (scoring, quiz transitions, parsing) sits in
`src/lib`/`src/api` with unit tests. UI is hand-rolled from design tokens — no UI kit.

```
app/                 # routes: _layout (providers), index (Home), exercise/[id], result
src/
  api/               # picsum fetcher + defensive mapper → Lesson[]
  components/        # ChunkyButton, Mascot, LessonCard, ExerciseVideo, TimerBar, BadgeReveal…
  data/              # mock questions (5 sets), sample video url
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive, usePressFeedback
  lib/               # strings (all Turkish copy), scoring, quiz state machine
  store/             # zustand + persist progress store (best result per lesson)
  theme/             # design tokens: colors, spacing, radius, typography, motion
__tests__/           # mirrors src/
docs/                # decision records (ADRs) + feature docs — see docs/README.md
```

## Design language

"Playful, calm, confident": cream background, chunky 3D-edge buttons, an original fox-emoji
mascot with speech bubbles, stars/badges for progress, celebration on success and gentle
encouragement on failure. One primary action per screen, ≥56dp targets, text always paired
with an icon, contrast ≥4.5:1, reduced-motion fallbacks everywhere. Rationale and rejected
alternatives: [ADR 0006](docs/decisions/0006-design-language.md).

## Assumptions (deliberate, documented)

1. **"Alıştırmaya Geç" unlocks when the video ends**; a load error unlocks it too with a
   friendly message — media must never block the flow ([ADR 0012](docs/decisions/0012-expo-video-events.md)).
2. **Quiz = 3 questions × 15 s**; timeout counts as wrong and auto-advances; the timer pauses
   while the app is backgrounded ([ADR 0013](docs/decisions/0013-timer-policy.md)).
3. **Pass ≥ 2/3; 3/3 = perfect badge; retakes keep the best result** — fair because a lesson
   always gets the same question set ([ADR 0015](docs/decisions/0015-question-assignment.md),
   [ADR 0017](docs/decisions/0017-idempotent-result-recording.md)).
4. **Leaving mid-quiz asks for confirmation and discards the attempt** ([ADR 0014](docs/decisions/0014-back-guard.md)).
5. **Home = 20 picsum items** ("Ders N: author"), cached for offline: with cache → list +
   banner; without → error state with retry ([ADR 0008](docs/decisions/0008-offline-policy.md),
   [ADR 0009](docs/decisions/0009-defensive-api-parsing.md)).

## Not production-ready / trade-offs

- **picsum.photos as "lessons"** and one sample video for all lessons; quiz content is local
  mock data (5 sets shared by 20 lessons).
- **No auth, no backend, no analytics**; progress lives only on-device (AsyncStorage).
- **iOS untested** — developed on Windows, verified on Android/Expo Go only (the code uses only
  cross-platform APIs).
- **No i18n system** — copy is centralized in `src/lib/strings.ts` (Turkish), but there is no
  locale switching.
- **JS timers** — the countdown is timestamp-based (drift-resistant) but still display-limited
  to ~100 ms granularity; fine for a kids quiz, not for anything precision-critical.
- **Web is incidental** — it runs (client-side only, [ADR 0011](docs/decisions/0011-web-output-single.md)),
  but browsers block autoplay-with-sound and it is not a supported target.
- **No E2E tests** — unit tests cover the pure logic; flows are covered by documented manual
  scripts in `docs/features/*`.
- **No parental gate** — required for a real kids product (app-store family policies); out of
  scope here by design.
- **Sample media dependency** — Google's classic sample bucket died mid-project (403) and was
  replaced with test-videos.co.uk; if that dies too, the flow degrades gracefully by design.

## What I'd do with more time

Real lesson content (per-lesson videos + authored question banks), a development-build +
EAS pipeline (unlocks MMKV, Lottie with owned assets, app-store delivery), an i18n layer,
Maestro E2E tests for the three flows, a parental gate, analytics with exactly-once attempt
ids, and a design pass with a real illustrator replacing the emoji mascot.

## Documentation

Every decision (library, pattern, UX rule, edge-case policy) has an ADR, and every screen has
a feature doc with behavior, code walkthrough, edge cases and manual test steps:
**[docs/README.md](docs/README.md)**.
