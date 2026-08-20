# Kids Learning App — Mini Flow

A small gamified learning flow for children (~5–8) built with React Native + Expo (SDK 57,
Expo Router, TypeScript strict). Three connected screens: **Home** (lesson list from a public
API with progress badges) → **Exercise** (short video, then a timed 3-question quiz on big
visual answer tiles) → **Result** (pass/fail celebration with an animated badge). Fully
bilingual (Türkçe/English) with an in-app language switch. Server data goes through TanStack Query
persisted to AsyncStorage; progress and settings live in persisted zustand stores; animations
are Reanimated; runtime failures funnel through one central, kid-friendly error path.

## How to run

I built and personally verified everything on **Windows + a physical Android phone (Expo
Go)**. The other cells follow standard Expo tooling — the code uses only cross-platform Expo
SDK APIs and CI builds the iOS bundle on every push — but I could not run them myself, so
they are marked honestly below.

Prerequisites everywhere: Node LTS (20+), then `npm install` once. For a physical phone, the
latest **Expo Go** (Play Store / App Store — Expo Go only runs the newest SDK; this project
is on SDK 57).

| Dev machine | Target                   | Steps                                                                                                                                  | Verified                   |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Windows     | Android phone (Expo Go)  | `npx expo start`, scan the QR with Expo Go (phone and PC on the same Wi-Fi). Network problems (firewalls): `npx expo start --tunnel`.  | ✅ personally tested       |
| Windows     | Android emulator         | Android Studio with an AVD, `npx expo start`, press `a`.                                                                               | ✅ personally tested       |
| Windows     | iPhone (Expo Go)         | `npx expo start`, scan the QR with the iPhone camera → opens in Expo Go (same LAN, or `--tunnel`). No iOS simulator exists on Windows. | ⚪ standard flow, untested |
| macOS       | iOS Simulator            | Xcode with its iOS Simulator installed, `npx expo start`, press `i`.                                                                   | ⚪ standard flow, untested |
| macOS       | Android (emulator/phone) | Android Studio with an AVD, `npx expo start`, press `a` — or Expo Go + QR on a physical phone.                                         | ⚪ standard flow, untested |

`npm test` and `npm run check` behave identically on Windows and macOS: the npm scripts and
git hooks are plain POSIX sh (Git Bash on Windows, zsh/bash on macOS) with no
platform-specific syntax or paths.

Checks: `npm run check` runs the whole gate suite in order — typecheck (which first
regenerates Expo Router's gitignored typed routes, so it works on a fresh clone), ESLint,
Prettier check, Jest (108 tests) and a bundle export for **Android, iOS and web** in one
pass. Individual scripts: `npm run typecheck` · `npm run lint` / `lint:fix` ·
`npm run format` / `format:check` · `npm test` · `npm run build`. `npx expo-doctor` for
environment sanity.

Git hooks are installed automatically by `npm install` (husky): **pre-commit** runs
lint-staged (ESLint + Prettier on staged files) plus a full typecheck, **commit-msg**
enforces Conventional Commits, and **pre-push** runs the entire `npm run check` — nothing
that fails a gate leaves the machine.

## Quality gates & CI

GitHub Actions (`.github/workflows/ci.yml`) runs the same suite as `npm run check` — install,
typecheck, lint, format check, tests, and the Android + iOS + web bundle export — as a single
fail-fast job on every pull request into `main` and every push to `main`; superseded runs are
auto-cancelled, and `main` pushes upload the exported bundles as an artifact (proof that main
always builds, for both mobile platforms).
The repo is private on the GitHub Free plan, where branch rulesets cannot be enforced
server-side yet; an import-ready ruleset (require PR, require the green `ci` check, linear
history, no force pushes or deletion) is committed at `.github/rulesets/main.json` to apply
the moment the plan allows — until then the pre-push hook is the enforced gate.

## Languages

Turkish and English. First launch follows the device language (anything else falls back to
Turkish). The Home header shows two flag tiles, each language written in its own name
(🇹🇷 Türkçe / 🇬🇧 English) so a pre-reader can find theirs; tapping the other tile plays a
short (~0.85 s) full-screen transition — the mascot bounces while the whole app, question
content and screen-reader labels included, switches underneath — and the choice is
persisted across restarts. Reduced motion swaps instantly with no overlay. All copy lives
in `src/locales/tr.json` / `en.json`; translation keys are compile-checked (an unknown key
fails `tsc`), an ESLint rule (`i18next/no-literal-string`) blocks hardcoded UI text, and a
test suite enforces that both files have identical keys, no empty values and matching
placeholders. Question data is language-neutral (visuals and correct answers shared, text
per language). The one plural-sensitive string uses `Intl.PluralRules`, polyfilled at
runtime on engines without it (Hermes).

## Architecture overview

Routes under `app/` are thin screens that compose everything from `src/`. The main data
flows: picsum list → React Query (persisted to AsyncStorage for offline) → Home; local
question bank + i18n resources → Exercise (pure quiz state machine + countdown hook); quiz
result → zustand (persisted) → Home badges. Runtime failures — network, media, storage,
crashes — go through one funnel (`handleError`): always logged (dev-only logger with a
crash-reporter hook point), surfaced to the child only as a calm translated banner or a
full-screen fallback, never as codes or stack traces. All pure logic (scoring, quiz
transitions, feedback mapping, defensive API parsing, tile sizing, generic helpers) sits in
`src/lib`/`src/api`/`src/utils` and is unit-tested; UI is hand-rolled from design tokens,
no UI kit.

```
app/                 # routes: _layout (providers, error boundary), index (Home), exercise/[id], result
src/
  api/               # picsum fetcher + defensive mapper → Lesson[]
  components/        # AnswerGrid/AnswerTile, ChunkyButton, Mascot, LessonCard, ExerciseVideo,
                     # ExitConfirmSheet, VideoUnavailableCard, GlobalErrorBanner, LanguageSwitch,
                     # LanguageTransitionOverlay, TimerBar, SegmentedProgress, BadgeReveal…
  constants/         # cross-cutting config: timing, touch targets, api values, media url, quiz shape
  data/              # question bank (5 visual sets; text via i18n)
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive,
                     # usePressFeedback, useNavigationLock
  i18n/              # i18next singleton (synchronous init, typed keys)
  lib/               # scoring, quiz state machine, error funnel + logger, haptics, storage
  locales/           # tr.json / en.json resources (namespaced per screen)
  store/             # zustand stores: progress + settings (persisted), error banner +
                     # language transition (in-memory)
  theme/             # design tokens: colors, spacing, radius, typography, motion
  utils/             # React-free helpers: clamp, hashString, routeParams
__tests__/           # mirrors src/ and app/
```

## Assumptions

Where the brief was open, I decided and implemented as follows:

1. **The quiz unlocks when the video ends.** If the video can't play — a player error, no
   playable video within 12 s, or the device is offline — a card explains that the questions
   are about this video and **the child chooses**: try again, or continue without it. Media
   never blocks the flow, but it never silently skips ahead either.
2. **3 questions per lesson, 15 s each.** A visible shrinking timer bar; timeout counts as a
   wrong answer and auto-advances. The timer **pauses while the app is backgrounded** (a call
   or home-button press must not eat the child's time) and resumes where it stopped.
3. **Pass = at least 2/3.** 3/3 earns a "perfect" badge, 2/3 a normal badge, less earns
   encouragement and an obvious retry. **Retakes keep the best result** — fair, because a
   lesson always gets the same question set (derived deterministically from the lesson id).
4. **Leaving mid-exercise asks for confirmation.** An always-visible 🏠 button (both
   stages) and the back button/gesture all open the same confirm sheet — lesson thumbnail,
   mascot, "keep going" as the safe default — while the video and the question timer pause
   underneath. Confirming discards that attempt; nothing is recorded until the Result
   screen, which records exactly once.
5. **"Progress/badge indicator" = stars.** One ⭐ per correct answer of the best completed
   attempt (⭐⭐☆ of 3), shown under each map node and summed on the dashboard; badges remain
   the Result screen's celebration. Driven by completed attempts only.
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
9. **The language switch is visual and deliberate.** Flag tiles with each language's own
   name (recognizable to a pre-reader), and changing language plays a short mascot
   transition instead of an instant reskin — the child sees a moment happen, and the swap
   lands while the screen is covered so no half-translated frame ever shows. Reduced motion
   skips the ceremony entirely.
10. **Deliberate deviation from the brief: lessons unlock sequentially, and tapping a lesson
    opens a bubble, not the exercise.** The brief says tapping a list item opens the Exercise
    screen; the exercises tab is instead a progress path where lesson N+1 unlocks once lesson
    N has ≥2⭐, and tapping a node opens a small bubble (thumbnail, title, stars, "Başla").
    Rationale: the gamified path gives visible progression and a reason to master a lesson,
    a locked map needs a place to explain "why not this one", and the confirm step protects
    against accidental taps at this age. The open path stays two taps (node → Başla).

## Not production-ready / trade-offs

- **picsum.photos as "lessons"** and one sample video for all lessons; quiz content is a
  local mock bank (5 sets shared by 20 lessons).
- **No backend, no auth, no analytics** — progress lives only on-device (AsyncStorage).
- **Read-aloud is a visual affordance pending TTS.** The 🔊 buttons next to child-facing text
  give honest press feedback but play no audio yet; a text-to-speech engine (expo-speech)
  drops into the existing `speak(text, language)` interface.
- **iOS is device-untested.** Every gate builds the iOS bundle (so it compiles) and the
  code uses only cross-platform Expo SDK modules, but I develop on Windows and had no
  Apple hardware: real-device rendering, haptics, video playback and VoiceOver on iOS are
  unverified.
- **Flags stand for languages** on the switch — semantically imprecise (flags denote
  countries; 🇬🇧 for English is an arbitrary pick among anglophone flags). Accepted for a
  two-language kids' app because a pre-reader recognizes a flag faster than a word; each
  tile also carries the language's own name.
- **Changing language takes ~0.85 s by design** — the transition is deliberate ceremony,
  not lag; reduced-motion users get an instant swap. The delay is a knob
  (`LANGUAGE_TRANSITION` constants) if it ever feels wrong on slower devices.
- **Branch protection is deferred** — private repo on GitHub Free, where rulesets can't be
  enforced server-side; the committed ruleset applies later, the pre-push gate enforces now.
- **No crash reporter wired** — every failure already funnels through one logger with an
  explicit production hook point, so wiring Sentry (or similar) is a one-file change; until
  then production failures are surfaced to the user but not collected.
- **Language toggle is not parent-gated** — a child can flip languages (harmless, reversible
  in one tap); a real product would move it behind the parental gate.
- **JS timers** — the countdown is timestamp-based (drift-resistant) but display granularity
  is ~100 ms; fine for a kids quiz, not precision-critical use.
- **No E2E tests** — 108 unit/component tests cover logic and screen decision points; full
  flows were verified manually on device.
- **No parental gate** — a real kids product needs one (app-store family policies); out of
  scope here by design.
- **Public sample video** — Google's classic sample bucket started returning 403 mid-project
  and was replaced with test-videos.co.uk; if that dies too, the child gets the choice card
  (retry / continue without the video) instead of a broken screen.
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
5. **Analytics + crash reporting** with exactly-once attempt ids — the central error
   funnel's production hook point is where the reporter plugs in.
6. **Performance pass** — FlashList for longer lists, image prefetch for the quiz's photo
   question.
7. **iOS device verification** (the bundle already builds in every gate) and a parental
   gate.
