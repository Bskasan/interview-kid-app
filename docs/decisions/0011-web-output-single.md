# 0011 — Web output "single" (no Node static rendering)

Status: accepted
Date: 2026-08-19

## Context

The SDK 57 template ships `web.output: "static"`, which pre-renders every route in a **Node**
environment (dev server and export). Opening the app in a browser crashed the dev server with
`ReferenceError: window is not defined`: creating the zustand `persist` store at module load
makes AsyncStorage's web backend touch `window.localStorage`, which does not exist in Node.
The shipping target of this project is Expo Go on Android; web is only an incidental dev
convenience.

## Decision

Set `web.output` to `"single"` in `app.json`: classic single-page output where the app renders
only in the browser (where `window` exists). No app code executes in Node anymore, so
storage-backed modules need no server guards.

## Alternatives considered

- **Make every storage-touching module SSR-safe** (`typeof window` guards, `skipHydration`,
  no-op storage shims in Node) — the "correct" fix for a real web product, but it is a permanent
  tax on every future store/persister for a platform this project does not ship. Easy to get
  subtly wrong (hydration timing differs per platform).
- **Remove web support entirely** (drop `react-dom`/`react-native-web`, delete the web block) —
  honest, but keeping a working browser preview costs nothing with `"single"` and is occasionally
  useful for quick layout checks.

## Consequences

- Web loads as a plain SPA; no static HTML/SEO — irrelevant for a kids app targeting Expo Go.
- Web remains **unsupported/untested** territory (noted in the README trade-offs); Android in
  Expo Go stays the verified platform.
- If a real web target ever appears, this decision flips: `"static"` + SSR-safe storage.

## References

- Expo Router docs page "Static rendering" on web output modes (unverified link — the guessed URL 404'd at review time, so only the page name is given)
- AsyncStorage in Expo (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/
