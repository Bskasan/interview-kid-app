# Result screen

Route: `app/result.tsx` — celebration (or encouragement) after a completed quiz.

## a) What the user sees

**Passed (2/3 or 3/3)**

1. Big title: "Bravo! 🎉" (2/3) or "Müthiş! Hepsi doğru 🌟" (3/3), with the score line
   ("2/3 doğru") underneath.
2. The badge pops in with a spring and a slight tilt — a gold-ringed 🏅 for a normal pass, a
   purple-ringed 🌟 for perfect — with a glow ring and a small confetti burst. A success haptic
   fires. The mascot is proud ("Seninle gurur duyuyorum!" / "Vay! Hepsini bildin!").
3. Buttons: "🏠 Ana Sayfa" as the green primary, "🔄 Tekrar Dene" as the blue secondary
   (retaking keeps the best result).

**Failed (0–1/3)**

1. Encouraging title "Az kaldı! Bir daha deneyelim 💪" + score; no badge, no confetti.
2. The mascot is supportive ("Sorun değil, birlikte başarırız!").
3. "🔄 Tekrar Dene" is the green primary; "🏠 Ana Sayfa" the blue secondary.

Reduced motion (system setting): the badge appears statically — no confetti, no glow, no spring.
Back (button/gesture) goes Home — never back into the finished quiz. Returning Home shows the
lesson card's updated stars/badge immediately.

## b) How it works in code

- **Params** — `lessonId`, `correct`, `total` arrive as route-param strings from the quiz's
  `router.replace`; they are number-parsed defensively and `computeOutcome` (unit-tested,
  clamped) derives `{passed, badge}` — the screen never trusts raw params.
- **Recording (ADR 0017)** — a `useEffect` guarded by a ref calls
  `useProgressStore.recordResult(lessonId, correct, total)` exactly once per visit; the store's
  `mergeResult` keeps the best attempt and is idempotent, and only this screen ever writes
  progress (abandoning a quiz records nothing by construction). The success haptic lives in the
  same guarded effect.
- **Celebration (ADR 0016)** — `src/components/BadgeReveal.tsx`: Reanimated spring pop
  (`withSpring`, tilt settle), one-shot glow (`withDelay` + `withTiming`), 10 deterministic
  confetti pieces (index-derived offsets/delays); `useReducedMotion` short-circuits to a static
  badge. Colors follow ADR 0010: sun ring = earned, grape ring = perfect.
- **Navigation** — both buttons use `router.replace` ("Tekrar Dene" →
  `/exercise/[id]`, "Ana Sayfa" → `/`), so the history never contains a finished quiz or a
  stale result. Home updates live because `LessonCard` subscribes to the zustand store.
- Primary/secondary button variants swap with the outcome so the _likely_ next action is the
  big green one (design principle: one primary action).

## c) Edge cases handled

- Re-render / StrictMode double-effect / remount with same params → progress cannot inflate
  (ref guard + idempotent merge).
- Garbage or missing params (bad deep link): nothing is recorded (`total <= 0` or empty
  `lessonId`), outcome renders as failed-safe, and without a `lessonId` the retry button is
  hidden — Home remains reachable.
- Back from Result → Home (the quiz was `replace`d away); retry also `replace`s, so stacking
  Result→Exercise→Result… never grows history.
- A better earlier attempt is never overwritten by a worse retake (store policy, unit-tested).
- Reduced motion: full celebration downgrade, content identical.

## d) Manual test steps

1. Score 2/3 → "Bravo! 🎉", gold 🏅 badge pops with confetti + haptic; Home afterwards shows
   ⭐⭐☆ and the "Rozet 🏅" pill on that lesson.
2. Score 3/3 → perfect title, purple 🌟 badge; Home shows ⭐⭐⭐ + "Süper 🌟".
3. Score 0–1/3 → encouraging copy, no badge; Home shows "Devam et 💪" with the star count.
4. Retake a passed lesson and score worse → Home badge/stars unchanged (best kept).
5. Retake a failed lesson and pass → badge upgrades on Home.
6. On Result, press Android back → lands on Home (not the quiz).
7. Kill and reopen the app → earned badges still on Home (persisted store).
8. Enable "Remove animations" (Android accessibility) → badge appears without motion/confetti.

## e) References

- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- expo-haptics (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- zustand persist middleware: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- Expo Router SDK 55→56 migration (navigation entry used across the flow): https://docs.expo.dev/router/migrate/sdk-55-to-56/
