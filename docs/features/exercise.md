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
2. A short question ("Hangisi kırmızı?") and four big option buttons (emoji + word).
3. Tapping an option locks the quiz instantly (double-taps are ignored):
   - Correct: the option fills green with a ✓, success haptic, mascot cheers "Harika! 🎉".
   - Wrong: the tapped option gets a coral border with ✗ and a gentle shake, the correct one is
     revealed with a green outline ✓, mascot encourages "Olsun, devam! 💪".
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
- **Questions** — `src/data/questions.ts`: five Turkish sets; `getQuestionSet(lessonId)` picks one
  via a stable string hash, so a lesson always gets the same quiz (ADR 0015).
- **Quiz state** — `src/lib/quiz.ts`: pure transitions `answerQuestion` / `timeoutQuestion` /
  `advanceQuiz` over `{index, correct, answer, finished}`; guards against double taps and the
  timeout-vs-tap race. The screen holds this state in `useState` and schedules `advanceQuiz`
  1.4 s after an answer locks in.
- **Timer** — `src/hooks/useCountdown.ts` (ADR 0013): timestamp-deadline based, ticks every
  100 ms for display only; active only while `running` (no locked answer, quiz stage) **and**
  the app is foregrounded (`useAppActive` on AppState); pausing snapshots remaining time.
  `onExpire` → `timeoutQuestion`, once per question (`reset()` on index change re-arms).
  `TimerBar` renders progress + seconds; `SegmentedProgress` renders "Soru n/3".
- **Back guard** — `usePreventRemove` (React Navigation v7 under Expo Router) while
  `stage === 'quiz' && !finished`; native `Alert` with Kal/Çık; confirmed exit dispatches the
  intercepted action (ADR 0014). The finish effect runs with the guard already off and calls
  `router.replace('/result', …)`.
- **Feedback visuals** — `src/components/AnswerOption.tsx`: five states (idle, correct,
  wrongChoice, revealCorrect, lockedOut), meaning always carried by ✓/✗ + border shape, never
  color alone; gentle shake via Reanimated `withSequence`, skipped under reduced motion.

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

## d) Manual test steps

1. Open a lesson → video autoplays; CTA is muted; mascot says watch first.
2. Let the video end → CTA turns green; tap → quiz starts, timer counts from 15.
3. Answer correctly → green ✓ fill + haptic + cheering mascot, auto-advance ~1.4 s.
4. Answer wrong → coral ✗ border + shake + green outline on the right answer.
5. Let the timer expire → "Süre doldu ⏰", correct answer revealed, counts as wrong.
6. During a question, background the app 10 s → return: timer resumed where it stopped.
7. Press Android back during the quiz → dialog; "Kal" continues (timer intact), "Çık" leaves;
   Home shows no progress change for that lesson.
8. Finish 3 questions → Result placeholder shows "N/3 doğru"; Android back from Result goes
   Home, not back into the quiz.
9. Airplane mode, then open a lesson → video errors → mascot fallback + enabled CTA; quiz
   works fully offline.
10. Timer bar: verify green → yellow (≤10 s) → coral (≤5 s) plus the number turning coral.

## e) References

- expo-video (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/video/
- `useEventListener` (expo package): https://docs.expo.dev/versions/v57.0.0/sdk/expo/
- AppState: https://reactnative.dev/docs/appstate
- usePreventRemove: https://reactnavigation.org/docs/use-prevent-remove/
- Alert: https://reactnative.dev/docs/alert
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- Jest timer mocks: https://jestjs.io/docs/timer-mocks
