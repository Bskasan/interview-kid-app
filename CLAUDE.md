# CLAUDE.md — Kids Learning App (take-home assignment)

This file defines the non-negotiable conventions for this repo. Read it before every task.

## What this project is

A small React Native (Expo) take-home: a gamified learning flow for young children with three connected
screens — Home (lesson list from a public API) → Exercise (short video + timed multiple-choice quiz) →
Result (pass/fail + animated badge). Scope is ~1–2 days of focused work. Evaluators care about
**decisions, edge-case handling and clarity**, not visual polish. The developer will be asked to
explain and defend every decision in a follow-up interview — so every decision must be documented
(see "Documentation rules").

## Hard constraints

- **Expo managed workflow, must run in Expo Go** (developer is on Windows, tests on a physical Android
  phone; iOS is untested). Do not add any library that requires a custom dev client or native config
  changes. Before adding a dependency, confirm it is Expo Go–compatible.
- **Never use `expo-av`.** It is deprecated and removed from the SDK. Use `expo-video` for video
  (`useVideoPlayer` + `<VideoView>`). If audio is ever needed, use `expo-audio`.
- Install dependencies with `npx expo install <pkg>` (SDK-pinned versions), never plain `npm install`
  for Expo/RN packages.
- TypeScript everywhere, `strict: true`. No `any` unless justified with a comment.
- Home data must come from the network (picsum.photos). Exercise questions are local mock data.
- **No third-party IP.** The design is _inspired by_ Khan Academy Kids and Duolingo, but never copy
  their logos, mascots (no owl), brand names, exact brand colors, fonts or illustrations. Everything
  visual must be original or generic (emoji, simple shapes, our own tokens).

## Stack (fixed — do not swap without asking)

- Expo (latest SDK, default template) + Expo Router (file-based routes under `app/`)
- `@tanstack/react-query` for server data, persisted to AsyncStorage for offline cache
- `zustand` (+ `persist` middleware with AsyncStorage) for user progress/badges
- `expo-video`, `expo-image`, `expo-haptics`, `react-native-reanimated`, `react-native-safe-area-context`
- `@react-native-community/netinfo` for online/offline state
- Jest via `jest-expo` + `@testing-library/react-native`

## Project layout

```
app/                 # routes only — thin screens that compose components/hooks
  _layout.tsx        # providers (QueryClient + persistence, SafeArea), Stack
  index.tsx          # Home
  exercise/[id].tsx  # Exercise
  result.tsx         # Result (params: lessonId, correct, total)
src/
  api/               # fetchers + mappers (picsum → Lesson)
  components/        # presentational, reusable UI
  data/              # mock questions
  hooks/             # useCountdown, useNetworkStatus, etc.
  lib/               # pure logic (scoring, badge rules, strings) — unit-tested
  store/             # zustand stores
  theme/             # design tokens (colors, spacing, radius, typography, motion)
  types/             # shared types
__tests__/           # mirrors src/
docs/                # decisions + feature docs (see "Documentation rules")
  README.md          # index of all docs
  decisions/         # ADR-style decision records, one file per decision
  features/          # one file per feature/screen
```

## Design language (theme) — "playful, calm, confident"

Inspiration: the warmth and friendliness of Khan Academy Kids (ages 2–8, character-led, pressure-free,
bright visuals, read-aloud friendly) + the clarity and tactile gamification of Duolingo (one action per
screen, chunky buttons, visible progress bar, instant feedback, celebration moments). Target users here
are roughly 5–8 years old: early readers, so text is minimal and always paired with an icon/emoji.

Principles (apply on every screen):

1. **One primary action per screen**, bottom-anchored, full-width, impossible to miss. Minimal elements
   on screen; no clutter, no secondary navigation chrome.
2. **Big everything.** Touch targets ≥ 56dp for primary controls (48dp absolute minimum), body text
   ≥ 18sp, titles 28–34sp, generous spacing. Small hands, imprecise taps.
3. **Immediate multimodal feedback.** Every tap: color change + small scale bounce + haptic. Correct
   answer: green fill + check + light haptic. Wrong answer: soft coral + gentle shake (no harsh red X,
   no punishing sounds). Never rely on color alone — always pair with icon/shape.
4. **Progress is always visible.** Segmented progress bar at top of the exercise, stars/badge state on
   every home card, "Soru 2/3" style labels.
5. **Celebrate, don't punish.** Result screen is a celebration moment (badge pops in with spring +
   confetti). Failure copy is encouraging ("Az kaldı! Bir daha deneyelim 💪"), with an obvious retry.
6. **Chunky, tactile buttons** (Duolingo-like feel, our own styling): rounded (16–20 radius), solid
   color, a darker 4px bottom edge that collapses on press (implement with `Pressable` +
   `pressed` style: translateY + remove bottom border).
7. **Warm, not overstimulating.** Cream background, max 2–3 saturated colors per screen, lots of
   whitespace, soft ink text color instead of pure black. Motion is springy but short (200–400 ms).
8. **Friendly guide.** A simple original mascot (pick a generic animal emoji such as 🦊 or 🐼 — NOT an
   owl, NOT a bear named like any existing app character) appears on Exercise/Result with short
   speech-bubble copy. Keep it cheap: emoji in a circle is enough.
9. **Safe by default.** No outbound links, no ads, no social, no text input. (Parental gate is out of
   scope — note it in README as a production requirement.)
10. **Copy:** short, friendly Turkish, 2nd person singular, exclamation-light, max ~6 words per label.
    Centralized in `src/lib/strings.ts`.

Tokens (put in `src/theme/`; these are ours, tweak freely but keep the roles):

- Colors: `background #FFF8EC` (cream), `surface #FFFFFF`, `ink #3A3A3A`, `muted #8C8C8C`,
  `primary #3DC35B` (green — CTA/success), `primaryDark #2E9E47` (button bottom edge),
  `sky #2FB5F0`, `sun #FFC83D` (stars/badges), `coral #FF6B5B` (wrong/danger — soft, not red),
  `grape #8E5CF6` (perfect badge), `border #E8E2D4`.
- Radius: card 24, button 18, pill 999. Spacing scale 4/8/12/16/24/32.
- Typography: system font is fine (rounded sans like Nunito via `@expo-google-fonts` is optional and
  must stay Expo Go–compatible); weights bold for titles/buttons.
- Motion: `spring` for appear/press, `timing 200–300ms` for color, `useReducedMotion` → no confetti,
  no bounce, instant states. Contrast ≥ 4.5:1 for all text.

## Code conventions

- Code, comments and commit messages in **English**. All **user-facing strings in Turkish**. Docs in
  `docs/` are written in **English** unless the developer says otherwise (they are review material).
- Pure logic (scoring, pass threshold, badge level, timer math) lives in `src/lib` and has unit tests.
  Screens stay thin.
- Every async/remote state handles: loading, error (with retry), empty, offline. No silent failures.
- Accessibility: `accessibilityRole`/`accessibilityLabel`/`accessibilityState` on interactive
  elements, respect reduced motion, large targets (see design language).
- Minimal, readable styling with `StyleSheet` + theme tokens. No UI kit.
- Small, logical **conventional commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). One concern per
  commit. Commit after each phase — the git history is part of what gets evaluated.

## Documentation rules (mandatory — the developer must be able to defend every choice)

1. **Every decision gets a decision record** in `docs/decisions/NNNN-short-title.md`, created in the
   same commit as the change. "Decision" = any library choice, architectural pattern, UX rule, edge-case
   policy, or non-obvious implementation choice. Template:
   ```
   # NNNN — Title
   Status: accepted | superseded by NNNN
   Date: YYYY-MM-DD
   ## Context        — the problem/constraint that forced a choice
   ## Decision       — what we chose, in 2–4 sentences
   ## Alternatives considered
   - **Alt A** — what it is; why we did NOT pick it (concrete trade-off)
   - **Alt B** — ...
   ## Consequences   — what this makes easier/harder, risks, what would change at production scale
   ## References     — official docs / sources (verified URLs only)
   ```
2. **Every feature/screen gets a feature doc** in `docs/features/<feature>.md` written right after the
   feature is implemented, covering: (a) what the user sees and how it behaves in the app, step by step;
   (b) how it works in code — files involved, data flow, key hooks/APIs and why they are used that way;
   (c) edge cases handled and how; (d) how to test it manually; (e) **References** — links to the
   official documentation for every external API used (e.g. expo-video `useVideoPlayer`/`VideoView`,
   TanStack Query persistence, zustand `persist`, Reanimated, AppState, Expo Router navigation guards).
3. **Reference links must be real.** Only link official documentation (docs.expo.dev, reactnative.dev,
   tanstack.com, zustand docs, docs.swmansion.com). If a URL cannot be verified (e.g. via a fetch tool
   or you are not certain it exists), write the doc page _name_ and mark it "(unverified link)" instead
   of inventing a URL.
4. Keep `docs/README.md` as an index: list every decision and feature doc with a one-line summary.
5. At the end of every phase, also summarize in chat: the decisions made, why, the alternatives and why
   they were rejected — in 3–6 short bullets — so the developer can rehearse them for the interview.

## Definition of done for any task

- `npx tsc --noEmit` passes
- `npm test` passes
- `npx expo-doctor` reports no issues (or you explain why)
- Decision records + feature docs for the task exist and `docs/README.md` is updated
- You tell the developer exactly what to verify manually on the device (they run Expo Go, you cannot)

## Decisions already made (see README "Assumptions")

These are deliberate; implement them as specified and document them (as decision records), don't
re-litigate:

1. "Alıştırmaya Geç" is enabled only after the video **ends**. If the video fails to load or errors, show
   a friendly message and enable the button anyway (media must never block the flow).
2. Quiz: 3 multiple-choice questions per lesson, **15 s per question**. Timeout = counted as wrong,
   auto-advance. Timer **pauses** when app goes to background (AppState) and resumes on foreground.
3. Pass threshold: **≥ 2/3 correct**. 3/3 = "perfect" badge, 2/3 = normal badge, <2 = no badge, retry
   allowed. Retaking a lesson keeps the **best** result.
4. Leaving the exercise mid-way (back gesture/button) asks for confirmation; progress of that attempt is
   discarded. Home progress reflects only completed attempts.
5. Home list: 20 items from `https://picsum.photos/v2/list?page=1&limit=20`; title is generated
   ("Ders N: {author}"); thumbnail `https://picsum.photos/id/{id}/200/200`. Cached for offline; when
   offline with cache → show list + banner; offline without cache → error state with retry.
