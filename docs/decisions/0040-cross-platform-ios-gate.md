# 0040 — Cross-platform dev + JS-bundle export as the iOS gate

Status: accepted
Date: 2026-08-20

## Context

The evaluator may clone on a Mac and open the app on an iPhone. Development happened
entirely on Windows + Android; nothing had ever _built_ for iOS, and nothing stopped a
Windows-ism (cmd syntax, path separators, case-insensitive filename luck) from landing.
Constraints: no macOS hardware or CI runners available, no Expo/EAS account, Expo Go only.

## Decision

Gate iOS at the JavaScript layer: `npm run build` becomes `expo export --platform all`,
which Metro-bundles **Android, iOS and web in one pass on any OS** (verified: `dist/`
gains `android/`, `ios/` and `web/` bundles; web rides along because it is configured in
app.json). Since `check`, the pre-push hook and CI all call `build`, every push now proves
the iOS bundle compiles — resolver errors, platform-forked imports and iOS-only syntax
issues fail the gate without a Mac. Supporting changes: `forceConsistentCasingInFileNames`
made explicit in tsconfig (imports that only work on case-insensitive filesystems fail
typecheck), a case-collision scan of tracked filenames (none found), and app.json's `ios`
section gains `supportsTablet: true` (iPad runs the same layout; the app is flex-based with
no phone-only assumptions). Audited and confirmed already-portable, no changes needed: all
npm scripts (no `set FOO=`, no `%VAR%`, `&&` chaining only — so no `cross-env` dependency),
all three husky hooks (plain POSIX sh, LF endings pinned by `.gitattributes`).

## Alternatives considered

- **EAS Build for a real iOS binary** — the honest full gate, but needs an Expo account and
  paid/queued cloud builds; out of proportion for a take-home that targets Expo Go anyway
  (Expo Go supplies the signed native shell, so the JS bundle IS the app's variable part).
- **macOS CI runner running `xcodebuild` / prebuild** — GitHub's macOS runners are billed
  minutes on private repos, and the managed workflow deliberately has no ios/ project to
  compile.
- **`cross-env` + Windows-style scripts** — solves a problem this repo doesn't have; the
  scripts contain no env-var assignments at all.
- **Leaving `build` Android-only** — the status quo; kept a whole platform invisible to
  every gate for zero savings (the extra bundles cost ~30 s locally, less in CI).

## Consequences

- `npm run check` and pre-push get slower by the two extra bundles — accepted as the price
  of gating what the evaluator will actually open.
- The artifact uploaded from `main` now contains all three bundles.
- **What stays untested without hardware** (also in README trade-offs): real-device
  rendering (safe-area insets on the notch, font metrics), haptics feel, expo-video
  playback/controls on iOS, flag-emoji rendering, VoiceOver behavior. The bundle gate
  proves the code _builds_ for iOS, not that it _feels_ right there.
- A Mac-owning tester has a ready checklist in `docs/features/platforms.md`.

## References

- Expo CLI export (`--platform`): https://docs.expo.dev/more/expo-cli/
- app.json ios properties (`supportsTablet`): https://docs.expo.dev/versions/latest/config/app/
- TypeScript forceConsistentCasingInFileNames: https://www.typescriptlang.org/tsconfig/#forceConsistentCasingInFileNames
