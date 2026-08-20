# App shell — welcome, tabs, dashboard, settings

Routes: `app/index.tsx` (welcome, `/`), `app/(tabs)/_layout.tsx` + `home.tsx` / `exercises.tsx`
/ `settings.tsx`. The exercise player and Result stay outside the tabs.

## a) What the user sees

All copy resolves from `src/locales/{tr,en}.json`; Turkish quoted here.

1. **Every cold start**: a welcome screen — app name ("Minik Dersler"), the fox mascot saying
   "İzle, çöz, yıldız topla!", and one big "▶️ Başla" button. The hero fades in (~0.35 s,
   skipped under reduced motion); the button works immediately. Tapping Başla opens the tab
   shell; pressing back afterwards exits the app, never returns to the welcome.
2. **Tab bar** (bottom, always visible inside the shell): 🏠 Ana Sayfa, 🧩 Alıştırmalar,
   ⚙️ Ayarlar. The active tab's icon is full-strength and its label bold green; inactive tabs
   are dimmed gray. Labels switch language instantly with the rest of the app.
3. **Ana Sayfa (dashboard)**: mascot greeting "Merhaba! Bugün ne öğreniyoruz?", two cards —
   🔥 streak ("3 gün üst üste") and ⭐ total stars (the number counts up from 0 each time the
   tab gains focus; static under reduced motion) — and one big "🧩 Alıştırmalara Git" button.
4. **Ayarlar**: the language toggle (moved here from the old Home header) and the app version.
   Nothing else — no dead switches.
5. **During an exercise or on the Result screen there is no tab bar** — the quiz is
   full-screen; the exit sheet remains the only way out. Leaving mid-exercise returns to the
   Alıştırmalar tab ("Alıştırmalara dön"); "Ana Sayfa" on the Result screen returns to the
   dashboard, where the star count reflects the new result.

## b) How it works in code

- `app/index.tsx` — welcome at `/`; `router.replace('/(tabs)/home')` on Başla (replace = back
  can't return). Reanimated `FadeInDown/FadeInUp` entering with `ReduceMotion.System`; the
  button is never animated, so it is tappable from the first frame (ADR 0045). The dashboard
  route is named `home` because `(tabs)/index` would collide with the root `/` (group segments
  don't count toward URLs).
- `app/(tabs)/_layout.tsx` — Expo Router `Tabs`; per-tab `title` + `tabBarAccessibilityLabel`
  from `common:tabs.*` via `useTranslation` (labels live-switch); 64dp + bottom inset bar in
  theme tokens; focus = opacity + weight + tint, never color alone (ADR 0044).
- `app/(tabs)/home.tsx` — dashboard. Stars = pure `totalStars(results)` (`src/lib/scoring.ts`,
  clamped per record); streak from `streakStore`; both gated on `hasHydrated`. Count-up via
  `src/hooks/useCountUp.ts` (rAF ease-out ~600 ms, `restartKey` bumped by `useFocusEffect`,
  `animate: false` under reduced motion). Cards are `accessible` with full sentence labels
  (`dashboard.streak`/`starsA11y`, pluralized in en per ADR 0028).
- `app/(tabs)/settings.tsx` — `LanguageSwitch` row + version from already-installed
  `expo-constants` (`Constants.expoConfig?.version`).
- `app/(tabs)/exercises.tsx` — the former Home screen unchanged except the header toggle
  removed (since round 5 it renders the progress map — see exercises-map.md).
- Streak: rules in `src/lib/streak.ts` (pure; local calendar dates, DST-proof day diff,
  same-day identity no-op, rollback-safe — ADR 0046); state in `src/store/streakStore.ts`
  (`streak-v1`); fed by `src/hooks/useStreakTracker.ts`, mounted as a null-rendering
  `StreakTracker` beside the root overlays in `app/_layout.tsx` so launch and every foreground
  count on any screen.
- Re-pointed targets: error boundary → `/(tabs)/home`; exercise exit → `/(tabs)/exercises`;
  result "Ana Sayfa" → `/(tabs)/home`.

## c) Edge cases handled

- Back from the tabs never shows the welcome again (replace semantics); back from Result never
  re-enters a finished quiz (unchanged from 0017/0034).
- Streak: second open the same day is a no-op (no persist write); day change while the app
  stays foregrounded on any tab counts on the next foreground; clock rolled backwards leaves
  the streak untouched; corrupt stored date restarts at 1; month/year boundaries count as
  consecutive.
- Star count with an unhydrated store → 0 without flicker-crash; corrupt progress records are
  clamped per lesson, never inflating the sum.
- Reduced motion: welcome hero appears instantly; the star count renders the final number.
- Language change: tab labels, dashboard cards, settings rows all re-render (all copy through
  `t()`); the toggle in Settings drives the same round-4 ceremony.
- Tab-bar double-tap or rapid switching: tabs are idempotent; the exercise flow cannot be
  interrupted because it lives outside the shell.

## d) Manual test steps

1. Cold start (or Expo Go reload) → welcome appears every time; Başla is tappable immediately,
   even mid-animation; after entering the tabs, Android back exits the app.
2. Switch between all three tabs; each keeps its scroll/state; labels and icons read correctly
   in TalkBack (name + selected).
3. Dashboard: finish an exercise with 2/3 → return via "Ana Sayfa" → the ⭐ card counts up to
   the new total; revisit the tab → it counts up again; enable reduced motion → static number.
4. Streak: open the app → 1 gün. Set the device date forward one day (Settings → Date & time,
   disable automatic), reopen the app → 2 gün. Skip two days → resets to 1. Set the date
   backwards → the count does NOT reset. Re-enable automatic date/time afterwards — other apps
   can misbehave with a manual clock, so do this last and briefly. An Expo Go JS reload counts
   as a launch for this test.
5. Start an exercise → no tab bar anywhere in the flow; the exit sheet's "Alıştırmalara dön"
   lands on the Alıştırmalar tab; Result's "Ana Sayfa" lands on the dashboard.
6. Settings: toggle the language both ways (full ceremony), check the version row matches
   app.json.
7. Trigger the error banner (airplane mode + pull-to-refresh on the list) → the banner renders
   above the tab bar.

## e) References

- Expo Router Tabs: https://docs.expo.dev/router/advanced/tabs/
- Expo Router notation (groups): https://docs.expo.dev/router/basics/notation/
- Bottom-tab options: https://reactnavigation.org/docs/bottom-tab-navigator/
- Reanimated entering/exiting + ReduceMotion: https://docs.swmansion.com/react-native-reanimated/
- AppState: https://reactnative.dev/docs/appstate
- expo-constants (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/constants/
- useFocusEffect (Expo Router): https://docs.expo.dev/router/reference/hooks/
- zustand persist middleware: https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
