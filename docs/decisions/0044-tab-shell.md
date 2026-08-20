# 0044 — Bottom-tab shell; exercise and result stay outside the tabs

Status: accepted
Date: 2026-08-20

## Context

Round 5 restructures the app from a single flat Stack (Home → Exercise → Result) into a shell:
a dashboard, the lesson list, and a settings screen. Design principle #1 said "no secondary
navigation chrome" — written when the app was three screens deep; a three-destination app
without any navigation surface would bury two of them. CLAUDE.md's principle was amended in the
same change (round-4 precedent for amending the rules file when a task changes them). Typed
routes are on, so every route move must survive `expo customize tsconfig.json` + `tsc`.

## Decision

`app/(tabs)/` with three screens — `home` (dashboard), `exercises` (the lesson list),
`settings` — using Expo Router's `Tabs`. **`exercise/[id]` and `result` remain root-level Stack
routes outside the group**: pushed full-screen, they cover the tab bar automatically, so a
mid-quiz child cannot tab away and lose an attempt; the existing exit sheet remains the only way
out (0034's guard is untouched). Tab bar in our tokens: surface background, 1dp border top,
64dp + bottom inset, emoji icons (🏠 🧩 ⚙️), labels via `useTranslation` in the layout so they
live-switch with the language, `tabBarAccessibilityLabel` per tab, active tint `primary`. Focus
is never color alone: focused icon at full opacity vs 0.45, label weight 800 + tint.

Re-pointed navigation (all former `router.replace('/')` sites):

- Error boundary → `/(tabs)/home` — crash recovery lands on the neutral dashboard.
- Exercise exit (🏠 path with no intercepted action) → `/(tabs)/exercises` — identical
  destination to the hardware-back path (the exercise is pushed from that tab), so both exits
  behave the same; `exitPrompt`/`exitLeave` copy updated accordingly ("Alıştırmalara dön").
- Result "Ana Sayfa" → `/(tabs)/home` — the label finally means exactly where it goes, and the
  dashboard shows the just-earned stars.

## Alternatives considered

- **Keep the flat Stack, add a hamburger/back-based structure** — hidden navigation is exactly
  wrong for a pre-reader; tabs are the one pattern this age group reliably operates (persistent,
  visual, one tap).
- **Exercise/result inside the tab group (tab bar visible during quiz)** — a stray tab tap
  mid-question silently discards an attempt or, worse, leaves the timer running off-screen;
  moving them out costs nothing because the Stack already existed.
- **Custom tab bar component** — full styling control, but the built-in `tabBarStyle`/icon API
  reached the design language fine; a custom bar re-implements a11y, insets and state for zero
  visible gain.
- **react-navigation bottom-tabs directly** — standalone `@react-navigation/*` imports break
  the bundle under Expo Router SDK 57 (vendored copy); `Tabs` is the supported wrapper.

## Consequences

- The lesson list's header loses the language toggle (moved to Settings, 0043 control); the
  list screen itself is otherwise untouched.
- Three navigation call sites changed; the back-guard, result recording and deep-link params
  are untouched.
- The root overlays (error banner, language transition) render above the tab bar as Stack
  siblings — device checklist verifies Android elevation stacking.
- Principle #1's "one primary action per screen" still holds within each tab; the tab bar is
  shared chrome, not a competing action.

## References

- Expo Router Tabs: https://docs.expo.dev/router/advanced/tabs/
- Expo Router SDK 55→56 migration (vendored react-navigation): https://docs.expo.dev/router/migrate/sdk-55-to-56/
- Bottom tabs options (tabBarStyle, tabBarAccessibilityLabel): https://reactnavigation.org/docs/bottom-tab-navigator/
