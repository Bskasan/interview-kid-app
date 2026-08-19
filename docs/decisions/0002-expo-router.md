# 0002 — Expo Router (file-based routes)

Status: accepted
Date: 2026-08-19

## Context

The app has three connected screens (Home → Exercise → Result) with route params
(`lessonId`, quiz results), Android back-button handling, and a "replace, don't push"
navigation pattern after the quiz. We need a navigator that ships with the Expo default
template and handles deep-link-style params cleanly.

## Decision

Use **Expo Router** with file-based routes in the root `app/` directory
(`_layout.tsx` Stack, `index.tsx`, `exercise/[id].tsx`, `result.tsx`). Expo Router is the
default of the Expo template and is built on top of React Navigation, so React Navigation
APIs (e.g. navigation guards for the quiz back-confirmation) remain available where needed.

Note: the SDK 57 template scaffolds routes under `src/app/`; we moved them to root `app/`
to match this repo's documented layout (routes at `app/`, everything else under `src/`).
Expo Router supports both locations.

## Alternatives considered

- **React Navigation directly** — the underlying library; perfectly viable, but requires manual
  navigator/param-list wiring and typed-route boilerplate that Expo Router generates from the
  file system (`typedRoutes` experiment). Since Expo Router wraps it, we lose nothing: its APIs
  stay accessible for edge cases like `beforeRemove`/`usePreventRemove`.
- **No router (conditional rendering + useState)** — smallest dependency surface, but re-implements
  back handling, params and history semantics by hand; Android hardware back and the
  "replace so back doesn't re-enter a finished quiz" behavior become custom, bug-prone code.

## Consequences

- Navigation structure is visible in the file tree; screens stay thin route files that compose
  `src/` modules (per repo conventions).
- `router.replace` gives the exact history semantics decision #4 (discard attempt) and the
  Result screen need.
- Typed routes (template's `typedRoutes` experiment) catch bad `router.push` targets at compile
  time.
- Slight indirection: some advanced guard APIs are documented under React Navigation rather than
  Expo Router; feature docs link the exact pages used.

## References

- Expo Router introduction: https://docs.expo.dev/router/introduction/
