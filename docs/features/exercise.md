# Exercise screen

Route: `app/exercise/[id].tsx` — video stage, then a timed 3-question quiz.

## a) What the user sees

All copy is resolved from `src/locales/{tr,en}.json` at render time; Turkish is quoted here.

**Video stage**

1. A round 🏠 exit button floats top-left (both stages, always visible). The lesson video
   autoplays in a rounded 16:9 frame with native controls.
2. The fox mascot says "Önce videoyu izle 🎬"; the "🎯 Alıştırmaya Geç" button is disabled (muted).
3. When the video plays to the end, the mascot switches to "Süper! Şimdi alıştırma zamanı 🎯"
   and the button becomes green and pressable.
4. If the video can't play — a player error, no playable video within 12 s, or the device
   is offline — the video area is replaced by a card: the mascot explains "Video şu an
   açılmıyor. Sorular bu videoyla ilgili." with two big choices, "🔄 Tekrar dene" (tries
   the video again; if still offline the card stays) and "➡️ Videosuz devam et" (straight
   to the quiz). The child decides — nothing skips silently, and the quiz button of the
   happy path only ever enables after the video actually ends.
5. Backgrounding the app pauses playback.

**Quiz stage**

1. Top: segmented progress with "Soru 1/3" — each answered question's segment shows its
   outcome (green with a tiny ✓, coral with a tiny ✗ for wrong AND timed-out answers; the
   segment flips already during the feedback moment), the current question is a white segment
   with a softly pulsing blue outline (static under reduced motion), upcoming ones are beige.
   Then the shrinking time bar with a seconds counter — green, turning **yellow at 10 s** and
   **coral at 5 s**.
2. A short question ("Hangisi üçgen?") with a 🔊 read-aloud button beside it (visual
   affordance, ADR 0050 — also on the exit-sheet question and the video-unavailable message)
   and a 2×2 grid of big square tiles. Each tile shows a
   visual — a drawn shape, an emoji with a word under it, a big digit, or (in one question) a
   photo — on a small white chip, sized so the whole screen fits a 360×640 phone without
   scrolling.
3. Tapping a tile locks the quiz instantly (double-taps are ignored). Feedback tints the tile
   around the chip — the visual itself always stays on white, so a green shape can never
   disappear into a green "correct" fill:
   - Correct: light green wash + thick green border + ✓ corner badge, success haptic, mascot
     cheers "Harika! 🎉".
   - Wrong: light coral wash + thick coral border + ✗ badge and a gentle shake; the correct
     tile is revealed with the green wash + ✓; mascot encourages "Olsun, devam! 💪".
   - Timeout: counts as wrong; mascot says "Süre doldu ⏰" and the correct answer is revealed.
4. After ~1.4 s the next question appears with a fresh 15 s timer.
5. After the third question the screen is **replaced** by the Result screen carrying
   `lessonId`, `correct`, `total` (back from Result cannot re-enter the finished quiz).
6. Tapping 🏠 — or pressing back / swiping back on **either** stage — slides up the exit
   sheet: the lesson thumbnail, the mascot asking "Alıştırmayı bırakmak istiyor musun?",
   and two big tiles — "▶️ Devam et" (green, the safe default; backdrop tap and
   the system back do the same) and "🏠 Alıştırmalara dön". While the sheet is open the video
   and the question timer pause and a locked-in answer does not auto-advance; staying resumes
   everything. Confirming returns to the exercises tab and the attempt is discarded.
7. Backgrounding during a question freezes the timer; it resumes where it stopped.

## b) How it works in code

- **Video** — the screen owns an explicit state machine `loading → ready → ended | error`
  (ADR 0035). `src/components/ExerciseVideo.tsx` stays dumb: `useVideoPlayer(uri)`
  autoplays; `useEventListener` reports `statusChange: readyToPlay` (→ `onReady`),
  `playToEnd` (→ `onEnded`, the only unlock), and `statusChange: error` (→
  `onError(cause)`). `error` is also entered by a 12 s ready watchdog (paused while the
  exit sheet is open, re-armed per retry) and by being offline while loading
  (`useNetworkStatus`). On error, `src/components/VideoUnavailableCard.tsx` replaces the
  video area; retry bumps a `playerKey` so the remount recreates the player. Every error
  entry logs via `handleError(MEDIA, silent)`. Late events can't corrupt the machine: a
  stray `readyToPlay` never resurrects `ended`/`error`, an error never downgrades `ended`.
  `useAppActive` pauses on background; unmounting (stage switch/leaving) releases the
  player. Clip URL is `LESSON_VIDEO_URL` in `src/constants/media.ts`; the timings are
  `VIDEO_READY_TIMEOUT_MS` (12 s), `ANSWER_FEEDBACK_MS` (1.4 s), `SECONDS_PER_QUESTION`
  (15 s) and `COUNTDOWN_TICK_MS` (100 ms) in `src/constants/timing.ts`.
- **Questions** — `src/data/questions.ts`: five language-neutral sets (shapes, colors,
  counting, animals, objects) whose text resolves from the `questions` i18n namespace;
  `getQuestionSet(lessonId)` picks one via a stable string hash, so a lesson always
  gets the same quiz (ADR 0015). Each option is an `AnswerOptionData`: an optional visual
  (`emoji | shape | image`) plus a label — the type requires a visible `labelKey` or an
  explicit `a11yKey`, so every option has a guaranteed spoken name (shape options derive
  theirs in the active language, e.g. tr "Kırmızı üçgen"). Exactly one question in the bank
  uses a network image
  (picsum id 237) and carries a `fallbackEmoji` so it stays answerable offline (ADR 0019).
- **Quiz state** — `src/lib/quiz.ts`: pure transitions `answerQuestion` / `timeoutQuestion` /
  `advanceQuiz` over `{index, correct, answer, outcomes, finished}`; guards against double taps
  and the timeout-vs-tap race. `outcomes` records each question at lock-in time
  ('correct' | 'wrong' | 'timeout' — ADR 0049) and feeds `SegmentedProgress`, whose single
  accessibility label extends to "Soru 2/3. Soru 1: doğru, Soru 2: süre doldu…" (timeout is
  announced distinctly even though it renders like wrong). The screen holds this state in
  `useState` and schedules `advanceQuiz` 1.4 s after an answer locks in.
- **Timer** — `src/hooks/useCountdown.ts` (ADR 0013): timestamp-deadline based, ticks every
  100 ms for display only; active only while `running` (no locked answer, quiz stage) **and**
  the app is foregrounded (`useAppActive` on AppState); pausing snapshots remaining time.
  `onExpire` → `timeoutQuestion`, once per question (`reset()` on index change re-arms).
  `TimerBar` renders progress + seconds; `SegmentedProgress` renders "Soru n/3".
- **Exit flow** — `usePreventRemove` from `expo-router/react-navigation` (Expo Router vendors
  React Navigation since SDK 56; standalone `@react-navigation/*` imports fail the bundle),
  armed on both stages while `!finished && !leaving` (ADR 0034, superseding 0014's quiz-only
  Alert). Interception stashes the navigation action and opens
  `src/components/ExitConfirmSheet.tsx` (RN `Modal` + Reanimated slide/fade, reduced-motion
  instant; `onRequestClose` = stay); the 🏠 `src/components/ExitButton.tsx` opens the same
  sheet with no stashed action. Confirming flips `leaving` — the guard disarms on that
  render — then dispatches the stashed action (back paths) or
  `router.replace('/(tabs)/exercises')` (🏠).
  While the sheet is open: `ExerciseVideo` gets `suspended` (pauses; resumes only if it was
  playing), `timerRunning` is false, and the feedback auto-advance effect is held. The
  finish effect runs with the guard already off and calls `router.replace('/result', …)`.
  The sheet's thumbnail derives from the route id via `lessonThumbnailUrl` — no query
  access needed, works offline from the image cache.
- **Answer grid** — `src/components/AnswerGrid.tsx` renders two explicit rows of
  `AnswerTile`s; the pure `computeTileSize(useWindowDimensions())` fills two columns and caps
  height square-ish with a 120dp floor (ADR 0019). The grid is keyed by question index so
  per-tile state (e.g. an image load failure) resets each question.
- **Feedback visuals** — `src/components/AnswerTile.tsx`: five states (idle, correct,
  wrongChoice, revealCorrect, lockedOut) projected by the pure `feedbackForOption` in
  `src/lib/quiz.ts`. Feedback = light tint fill (`successTint`/`dangerTint` theme tokens, 18%
  blends over white) + a uniform 4dp full-strength border + the ✓/✗ corner badge; meaning is
  never color alone, and the badge mark is prefixed into the accessibility label. The option's
  visual and caption render on a **constant white chip** (2dp beige border) that no feedback
  state touches, so tint and artwork can never collide (ADR 0042); only `ink` text is allowed
  on the tints (contrast rule in `src/theme/colors.ts`). Gentle shake via Reanimated
  `withSequence`, skipped under reduced motion. Shapes are drawn with `react-native-svg`;
  images use `expo-image` and swap to the option's `fallbackEmoji` on error. The inner visual
  scales to 55% of the tile's short side (chip padding takes the rest), so cramped screens
  shrink artwork, never the tap target.

## c) Edge cases handled

- Video error, stall (>12 s without becoming playable) or offline entry → the choice card;
  the flow is never blocked (continue is one tap) and never skipped silently. Retry while
  still offline stays on the card instead of faking progress.
- Backgrounding: video pauses (AppState + expo-video default), quiz timer freezes and resumes.
- Rapid double-tap on options: first tap locks the machine, later taps are no-ops.
- Timeout racing a tap in the same instant: whichever transition runs first wins; the loser is
  ignored (pure-machine guarantee, unit-tested).
- Leaving mid-exercise by 🏠, hardware back, gesture or programmatic navigation: one
  confirmation sheet on both stages; the attempt is discarded because nothing is recorded
  until the Result screen.
- Android back while the sheet is open: the Modal intercepts it (`onRequestClose`) and it
  counts as "stay" — the guard can't double-fire under the sheet.
- Nothing moves behind the open sheet: timer frozen, video paused (resumes only if it was
  playing — an ended video stays ended), locked answers wait for the child's decision.
- Finishing must not trigger the exit sheet: guard is keyed off `finished` before the replace.
- Unknown/garbage lesson id: hash still selects a valid set; params are stringified on replace.
- Reduced motion: no shake, no press bounce (feedback stays visible via fills/icons/haptics).
- Image option offline or failing to load: the tile renders its `fallbackEmoji`, so the
  question stays answerable; only one question in the bank uses an image at all.
- Small screens (360×640): everything fits without scrolling; below ~545dp of window height
  tiles clamp to 120dp and only the inner visual shrinks.
- TalkBack: every tile announces a descriptive Turkish label ("Kırmızı üçgen", "Köpek
  fotoğrafı") plus selected/disabled state; ✓/✗ are part of the spoken label.

## d) Manual test steps

1. Open a lesson → video autoplays; CTA is muted; mascot says watch first.
2. Let the video end → CTA turns green; tap → quiz starts, timer counts from 15.
3. Check the quiz layout: 2×2 tiles, no scrolling, progress/timer/prompt/mascot all visible.
4. Answer correctly → light green wash + green border + ✓ badge + haptic + cheering mascot,
   auto-advance ~1.4 s; the tapped visual stays fully visible on its white chip.
5. Answer wrong → light coral wash + coral border + ✗ badge + gentle shake + green wash ✓ on
   the right tile.
   5b. Tint worst cases: in the colors set answer "Yeşil olan hangisi?" correctly → the green
   star must stay clearly visible (white chip) inside the green-washed tile; in the shapes
   set tap the coral triangle when it's wrong → the triangle must not blend into the coral
   wash/border; a counting question's digits stay ink-on-white in every state.
6. Let the timer expire → "Süre doldu ⏰", correct answer revealed, counts as wrong.
7. During a question, background the app 10 s → return: timer resumed where it stopped.
8. Tap 🏠 (or press Android back) on either stage → the sheet slides up with the lesson
   thumbnail; the timer/video freeze. "Devam et" (or tapping outside, or back again)
   resumes with the timer where it stopped; "Alıştırmalara dön" lands on the exercises tab with no progress
   change for that lesson. During the ✓/✗ feedback moment, open the sheet and wait —
   the next question must not appear until after you tap "Devam et".
9. Finish 3 questions → the Result screen shows "N/3 doğru"; Android back from Result goes
   Home, not back into the quiz.
10. Airplane mode, then open a lesson → the unavailable card appears (no 12 s wait);
    "Tekrar dene" while still offline stays on the card; "Videosuz devam et" starts the
    quiz, which works fully offline; the photo question shows its 🐶 emoji fallback.
    Re-enable network on the card → "Tekrar dene" → video loads and plays.
    With network on, cut the connection mid-load (or throttle) → the card appears at
    ~12 s. The exit sheet works from the card too.
11. Timer bar: verify green → yellow (≤10 s) → coral (≤5 s); the seconds number stays ink
    at all times (coral text would fail the contrast policy).
12. Reduced motion on (system setting) → no shake/bounce; fills, badges and haptics remain.
13. TalkBack spot-check: tiles announce their Turkish labels + selected/disabled state.
14. Narrow screen + large font: on 360×640 the 🔊 beside the question prompt is fully visible
    and the 2×2 grid still fits without scrolling; at the largest system font the prompt shrinks
    to its cap rather than ellipsizing mid-question, and the mascot bubble does not overlap the
    grid. Same check for the exit sheet and the video-unavailable card, whose mascot has the
    least room of any screen.

## e) References

- expo-video (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/video/
- `useEventListener` (expo package): https://docs.expo.dev/versions/v57.0.0/sdk/expo/
- AppState: https://reactnative.dev/docs/appstate
- usePreventRemove: https://reactnavigation.org/docs/use-prevent-remove/
- Expo Router SDK 55→56 migration: https://docs.expo.dev/router/migrate/sdk-55-to-56/
- Modal (transparent, statusBarTranslucent, onRequestClose): https://reactnative.dev/docs/modal
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- Jest timer mocks: https://jestjs.io/docs/timer-mocks
- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
- useWindowDimensions: https://reactnative.dev/docs/usewindowdimensions
