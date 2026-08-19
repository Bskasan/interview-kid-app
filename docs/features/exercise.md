# Exercise screen

Route: `app/exercise/[id].tsx` — video stage, then a timed 3-question quiz.

## a) What the user sees

**Video stage**

1. The lesson video autoplays in a rounded 16:9 frame with native controls.
2. The fox mascot says "Önce videoyu izle 🎬"; the "🎯 Alıştırmaya Geç" button is disabled (muted).
3. When the video plays to the end, the mascot switches to "Süper! Şimdi alıştırma zamanı 🎯"
   and the button becomes green and pressable.
4. If the video fails to load, the mascot says "Video açılmadı, sorun değil!" with the hint
   "Alıştırmaya geçebilirsin 👇" and the button unlocks anyway — media never blocks the flow.
5. Backgrounding the app pauses playback.

**Quiz stage**

1. Top: segmented progress (done = green, current = blue) with "Soru 1/3", then the shrinking
   time bar with a seconds counter — green, turning **yellow at 10 s** and **coral at 5 s**.
2. A short question ("Hangisi üçgen?") and a 2×2 grid of big square tiles. Each tile shows a
   visual — a drawn shape, an emoji with a word under it, a big digit, or (in one question) a
   photo — sized so the whole screen fits a 360×640 phone without scrolling.
3. Tapping a tile locks the quiz instantly (double-taps are ignored):
   - Correct: the tile fills green with a ✓ corner badge, success haptic, mascot cheers "Harika! 🎉".
   - Wrong: the tapped tile gets a coral border with an ✗ badge and a gentle shake, the correct
     tile is revealed with a green outline ✓, mascot encourages "Olsun, devam! 💪".
   - Timeout: counts as wrong; mascot says "Süre doldu ⏰" and the correct answer is revealed.
4. After ~1.4 s the next question appears with a fresh 15 s timer.
5. After the third question the screen is **replaced** by the Result screen carrying
   `lessonId`, `correct`, `total` (back from Result cannot re-enter the finished quiz).
6. Back button/gesture during the quiz: "Çıkmak istiyor musun? İlerlemen kaybolur." — "Kal"
   stays, "Çık" leaves and the attempt is discarded. The video stage exits without asking.
7. Backgrounding during a question freezes the timer; it resumes where it stopped.

## b) How it works in code

- **Video** — `src/components/ExerciseVideo.tsx`: `useVideoPlayer(uri)` autoplays; `useEventListener`
  subscribes to `playToEnd` (→ unlock) and `statusChange` `error` (→ friendly fallback + unlock)
  (ADR 0012). `useAppActive` pauses on background; unmounting (stage switch/leaving) releases the
  player. Clip URL in `src/data/media.ts`.
- **Questions** — `src/data/questions.ts`: five Turkish sets (shapes, colors, counting, animals,
  objects); `getQuestionSet(lessonId)` picks one via a stable string hash, so a lesson always
  gets the same quiz (ADR 0015). Each option is an `AnswerOptionData`: an optional visual
  (`emoji | shape | image`) plus a label — the type requires a visible `label` or an explicit
  `a11yLabel`, so every option has a guaranteed spoken name (shape options auto-generate
  Turkish names like "Kırmızı üçgen"). Exactly one question in the bank uses a network image
  (picsum id 237) and carries a `fallbackEmoji` so it stays answerable offline (ADR 0019).
- **Quiz state** — `src/lib/quiz.ts`: pure transitions `answerQuestion` / `timeoutQuestion` /
  `advanceQuiz` over `{index, correct, answer, finished}`; guards against double taps and the
  timeout-vs-tap race. The screen holds this state in `useState` and schedules `advanceQuiz`
  1.4 s after an answer locks in.
- **Timer** — `src/hooks/useCountdown.ts` (ADR 0013): timestamp-deadline based, ticks every
  100 ms for display only; active only while `running` (no locked answer, quiz stage) **and**
  the app is foregrounded (`useAppActive` on AppState); pausing snapshots remaining time.
  `onExpire` → `timeoutQuestion`, once per question (`reset()` on index change re-arms).
  `TimerBar` renders progress + seconds; `SegmentedProgress` renders "Soru n/3".
- **Back guard** — `usePreventRemove` from `expo-router/react-navigation` (Expo Router vendors
  React Navigation since SDK 56; standalone `@react-navigation/*` imports fail the bundle) while
  `stage === 'quiz' && !finished`; native `Alert` with Kal/Çık; confirmed exit dispatches the
  intercepted action (ADR 0014). The finish effect runs with the guard already off and calls
  `router.replace('/result', …)`.
- **Answer grid** — `src/components/AnswerGrid.tsx` renders two explicit rows of
  `AnswerTile`s; the pure `computeTileSize(useWindowDimensions())` fills two columns and caps
  height square-ish with a 120dp floor (ADR 0019). The grid is keyed by question index so
  per-tile state (e.g. an image load failure) resets each question.
- **Feedback visuals** — `src/components/AnswerTile.tsx`: five states (idle, correct,
  wrongChoice, revealCorrect, lockedOut) projected by the pure `feedbackForOption` in
  `src/lib/quiz.ts`; meaning always carried by a ✓/✗ corner badge + border shape, never color
  alone, and the badge mark is prefixed into the accessibility label. Gentle shake via
  Reanimated `withSequence`, skipped under reduced motion. Shapes are drawn with
  `react-native-svg`; images use `expo-image` and swap to the option's `fallbackEmoji` on
  error. The inner visual scales to 60% of the tile's short side, so cramped screens shrink
  artwork, never the tap target.

## c) Edge cases handled

- Video error → flow continues (CTA unlocked + friendly message); video never blocks.
- Backgrounding: video pauses (AppState + expo-video default), quiz timer freezes and resumes.
- Rapid double-tap on options: first tap locks the machine, later taps are no-ops.
- Timeout racing a tap in the same instant: whichever transition runs first wins; the loser is
  ignored (pure-machine guarantee, unit-tested).
- Leaving mid-quiz by button, gesture or programmatic navigation: one confirmation path; the
  attempt is discarded because nothing is recorded until the Result screen.
- Finishing must not trigger the exit dialog: guard is keyed off `finished` before the replace.
- Unknown/garbage lesson id: hash still selects a valid set; params are stringified on replace.
- Reduced motion: no shake, no press bounce (feedback stays visible via fills/icons/haptics).
- Image option offline or failing to load: the tile renders its `fallbackEmoji`, so the
  question stays answerable; only one question in the bank uses an image at all.
- Small screens (360×640): everything fits without scrolling; below ~510dp of usable height
  tiles clamp to 120dp and only the inner visual shrinks.
- TalkBack: every tile announces a descriptive Turkish label ("Kırmızı üçgen", "Köpek
  fotoğrafı") plus selected/disabled state; ✓/✗ are part of the spoken label.

## d) Manual test steps

1. Open a lesson → video autoplays; CTA is muted; mascot says watch first.
2. Let the video end → CTA turns green; tap → quiz starts, timer counts from 15.
3. Check the quiz layout: 2×2 tiles, no scrolling, progress/timer/prompt/mascot all visible.
4. Answer correctly → tile fills green with ✓ badge + haptic + cheering mascot, auto-advance ~1.4 s.
5. Answer wrong → coral border + ✗ badge + gentle shake + green outline ✓ on the right tile.
6. Let the timer expire → "Süre doldu ⏰", correct answer revealed, counts as wrong.
7. During a question, background the app 10 s → return: timer resumed where it stopped.
8. Press Android back during the quiz → dialog; "Kal" continues (timer intact), "Çık" leaves;
   Home shows no progress change for that lesson.
9. Finish 3 questions → Result placeholder shows "N/3 doğru"; Android back from Result goes
   Home, not back into the quiz.
10. Airplane mode, then open a lesson → video errors → mascot fallback + enabled CTA; quiz
    works fully offline; the photo question shows its 🐶 emoji fallback instead of the image.
11. Timer bar: verify green → yellow (≤10 s) → coral (≤5 s) plus the number turning coral.
12. Reduced motion on (system setting) → no shake/bounce; fills, badges and haptics remain.
13. TalkBack spot-check: tiles announce their Turkish labels + selected/disabled state.

## e) References

- expo-video (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/video/
- `useEventListener` (expo package): https://docs.expo.dev/versions/v57.0.0/sdk/expo/
- AppState: https://reactnative.dev/docs/appstate
- usePreventRemove: https://reactnavigation.org/docs/use-prevent-remove/
- Expo Router SDK 55→56 migration: https://docs.expo.dev/router/migrate/sdk-55-to-56/
- Alert: https://reactnative.dev/docs/alert
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- Jest timer mocks: https://jestjs.io/docs/timer-mocks
- react-native-svg (Expo SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- expo-image (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/image/
- useWindowDimensions: https://reactnative.dev/docs/usewindowdimensions
