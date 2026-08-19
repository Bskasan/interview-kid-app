# Kids Learning App — Mini Flow

A small gamified learning flow for children (~5–8) built with React Native + Expo (SDK 57,
Expo Router, TypeScript strict). Three connected screens: **Home** (lesson list from a public
API with progress badges) → **Exercise** (short video, then a timed 3-question quiz on big
visual answer tiles) → **Result** (pass/fail celebration with an animated badge). Server data
goes through TanStack Query persisted to AsyncStorage; progress lives in a persisted zustand
store; animations are Reanimated.

## How to run

Built and tested on **Windows + a physical Android phone (Expo Go)**. iOS is untested — the
code uses only cross-platform APIs, but I could not verify it.

Prerequisites: Node LTS (20+), and the latest **Expo Go** from the Play Store (Expo Go only
runs the newest SDK; this project is on SDK 57).

```bash
npm install
npx expo start
```

- **Physical phone**: scan the QR code with Expo Go (phone and PC on the same Wi-Fi).
- **Network problems** (firewalls, hotel Wi-Fi): `npx expo start --tunnel` — slower, but
  always reaches the phone.
- **Emulator**: press `a` in the Expo CLI (needs Android Studio with an AVD).

Checks: `npm test` (Jest, 65 tests) · `npx tsc --noEmit` · `npm run lint` · `npx expo-doctor`.
Note: Expo Router's typed routes are generated into `.expo/` by the dev server — on a fresh
clone run `npx expo start` once before `npx tsc --noEmit`.

## Architecture overview

Routes under `app/` are thin screens that compose everything from `src/`. The main data
flows: picsum list → React Query (persisted to AsyncStorage for offline) → Home; local
question bank → Exercise (pure quiz state machine + countdown hook); quiz result → zustand
(persisted) → Home badges. All pure logic (scoring, quiz transitions, feedback mapping,
defensive API parsing, tile sizing) sits in `src/lib`/`src/api` and is unit-tested; UI is
hand-rolled from design tokens, no UI kit.

```
app/                 # routes: _layout (providers), index (Home), exercise/[id], result
src/
  api/               # picsum fetcher + defensive mapper → Lesson[]
  components/        # AnswerGrid/AnswerTile, ChunkyButton, Mascot, LessonCard, ExerciseVideo,
                     # TimerBar, SegmentedProgress, BadgeReveal…
  data/              # question bank (5 visual sets), sample video url
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive, usePressFeedback
  lib/               # strings (all Turkish copy), scoring, quiz state machine
  store/             # zustand + persist progress store (best result per lesson)
  theme/             # design tokens: colors, spacing, radius, typography, motion
__tests__/           # mirrors src/ and app/
```

## Assumptions

Where the brief was open, I decided and implemented as follows:

1. **The quiz unlocks when the video ends.** If the video fails to load, a friendly message
   appears and the quiz unlocks anyway — media must never block the flow.
2. **3 questions per lesson, 15 s each.** A visible shrinking timer bar; timeout counts as a
   wrong answer and auto-advances. The timer **pauses while the app is backgrounded** (a call
   or home-button press must not eat the child's time) and resumes where it stopped.
3. **Pass = at least 2/3.** 3/3 earns a "perfect" badge, 2/3 a normal badge, less earns
   encouragement and an obvious retry. **Retakes keep the best result** — fair, because a
   lesson always gets the same question set (derived deterministically from the lesson id).
4. **Leaving mid-quiz asks for confirmation** (back button/gesture) and discards that
   attempt. Nothing is recorded until the Result screen, which records exactly once.
5. **"Progress/badge indicator" on Home** means: stars for the best score (⭐⭐☆ of 3) plus a
   status pill — not tried / keep going / badge / perfect badge — driven by completed
   attempts only.
6. **Offline policy**: the lesson list is cached; offline with cache shows the list plus an
   offline banner, offline without cache shows an error state with retry. The quiz itself is
   fully offline (local data; the single photo question falls back to an emoji).
7. **Answers are visual-first tiles** (2×2 grid of drawn shapes, emoji, digits, one photo)
   because the target age includes pre-readers; every tile still carries a descriptive
   accessibility label, sized so a small 360×640 screen fits everything without scrolling.
8. **Design language**: warm and calm — cream background, chunky 3D-edge buttons, an original
   fox-emoji mascot with speech bubbles, celebration on success, gentle encouragement (no
   harsh red, no punishing sounds) on failure. Inspired by popular kids' learning apps in
   spirit, with no third-party assets, names or brand colors; one primary action per screen,
   ≥56dp touch targets, text ≥18sp always paired with an icon, contrast ≥4.5:1, reduced
   motion respected everywhere.

## Not production-ready / trade-offs

- **picsum.photos as "lessons"** and one sample video for all lessons; quiz content is a
  local mock bank (5 sets shared by 20 lessons).
- **No backend, no auth, no analytics** — progress lives only on-device (AsyncStorage).
- **iOS untested** (Windows development machine).
- **No i18n system** — copy is centralized in `src/lib/strings.ts` (Turkish), but there is no
  locale switching.
- **JS timers** — the countdown is timestamp-based (drift-resistant) but display granularity
  is ~100 ms; fine for a kids quiz, not precision-critical use.
- **No E2E tests** — 65 unit/component tests cover logic and screen decision points; full
  flows were verified manually on device.
- **No parental gate** — a real kids product needs one (app-store family policies); out of
  scope here by design.
- **Public sample video** — Google's classic sample bucket started returning 403 mid-project
  and was replaced with test-videos.co.uk; if that dies too, the flow degrades gracefully
  (error message + unlocked quiz).
- **Web is incidental** — it runs client-side only, but browsers block autoplay-with-sound
  and it is not a supported target.

## What I would do with more time

In priority order:

1. **Real content model + backend** — per-lesson videos and authored question banks instead
   of picsum + shared mock sets.
2. **E2E tests with Maestro** for the three flows (happy path, timeout, abandon-and-retry).
3. **Audio narration of questions** — the honest fix for pre-readers; text alone excludes
   part of the target age.
4. **Sound effects and proper illustrations/mascot** from an owned asset set (development
   build would also unlock Lottie).
5. **i18n layer** on top of the already-centralized strings.
6. **Analytics + crash reporting** with exactly-once attempt ids.
7. **Performance pass** — FlashList for longer lists, image prefetch for the quiz's photo
   question.
8. **iOS verification** and a parental gate.
