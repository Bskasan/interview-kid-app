# Kids Learning App — Mini Flow

A small gamified learning flow for children (~5–8) built with React Native + Expo (SDK 57,
Expo Router, TypeScript strict). Three connected screens: **Home** (lesson list from a public
API with progress badges) → **Exercise** (short video, then a timed 3-question quiz on big
visual answer tiles) → **Result** (pass/fail celebration with an animated badge). Fully
bilingual (Türkçe/English) with an in-app toggle. Server data goes through TanStack Query
persisted to AsyncStorage; progress and settings live in persisted zustand stores; animations
are Reanimated; runtime failures funnel through one central, kid-friendly error path.

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

Checks: `npm run check` runs the whole gate suite in order — typecheck (which first
regenerates Expo Router's gitignored typed routes, so it works on a fresh clone), ESLint,
Prettier check, Jest (100 tests) and an Android bundle export. Individual scripts:
`npm run typecheck` · `npm run lint` / `lint:fix` · `npm run format` / `format:check` ·
`npm test` · `npm run build`. `npx expo-doctor` for environment sanity.

Git hooks are installed automatically by `npm install` (husky): **pre-commit** runs
lint-staged (ESLint + Prettier on staged files) plus a full typecheck, **commit-msg**
enforces Conventional Commits, and **pre-push** runs the entire `npm run check` — nothing
that fails a gate leaves the machine.

## Quality gates & CI

GitHub Actions (`.github/workflows/ci.yml`) runs the same suite as `npm run check` — install,
typecheck, lint, format check, tests, Android export — as a single fail-fast job on every
pull request into `main` and every push to `main`; superseded runs are auto-cancelled, and
`main` pushes upload the exported bundle as an artifact (proof that main always builds).
The repo is private on the GitHub Free plan, where branch rulesets cannot be enforced
server-side yet; an import-ready ruleset (require PR, require the green `ci` check, linear
history, no force pushes or deletion) is committed at `.github/rulesets/main.json` to apply
the moment the plan allows — until then the pre-push hook is the enforced gate.

## Languages

Turkish and English. First launch follows the device language (anything else falls back to
Turkish); the pill toggle in the Home header switches the whole app instantly — including
question content and screen-reader labels — and the explicit choice is persisted across
restarts. All copy lives in `src/locales/tr.json` / `en.json`; translation keys are
compile-checked (an unknown key fails `tsc`) and a test suite enforces that both files have
identical keys, no empty values and matching placeholders. Question data is language-neutral
(visuals and correct answers shared, text per language). The one plural-sensitive string
uses `Intl.PluralRules`, polyfilled at runtime on engines without it (Hermes).

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
                     # ExitConfirmSheet, VideoUnavailableCard, GlobalErrorBanner, LanguageToggle,
                     # TimerBar, SegmentedProgress, BadgeReveal…
  data/              # question bank (5 visual sets; text via i18n), sample video url
  hooks/             # useLessons, useNetworkStatus, useCountdown, useAppActive,
                     # usePressFeedback, useNavigationLock
  i18n/              # i18next singleton (synchronous init, typed keys)
  lib/               # scoring, quiz state machine, error funnel + logger, haptics, storage
  locales/           # tr.json / en.json resources (namespaced per screen)
  store/             # zustand stores: progress + settings (persisted), error banner (in-memory)
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
- **Branch protection is deferred** — private repo on GitHub Free, where rulesets can't be
  enforced server-side; the committed ruleset applies later, the pre-push gate enforces now.
- **No crash reporter wired** — every failure already funnels through one logger with an
  explicit production hook point, so wiring Sentry (or similar) is a one-file change; until
  then production failures are surfaced to the user but not collected.
- **Language toggle is not parent-gated** — a child can flip languages (harmless, reversible
  in one tap); a real product would move it behind the parental gate.
- **JS timers** — the countdown is timestamp-based (drift-resistant) but display granularity
  is ~100 ms; fine for a kids quiz, not precision-critical use.
- **No E2E tests** — 100 unit/component tests cover logic and screen decision points; full
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
7. **iOS verification** and a parental gate.
