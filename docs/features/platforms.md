# Platforms — Windows/macOS dev, Android/iOS targets

## a) What the user sees

The same app on every platform: Expo Go loads the project from the dev server (QR scan on a
physical phone, `a`/`i` keypress for emulator/simulator). No platform-specific screens,
navigation or features exist; the web export exists only because it falls out of the build
for free and is not a supported target.

## b) How it works in code

- **One JS codebase, zero platform forks**: no `.ios.tsx`/`.android.tsx` files, no
  `Platform.select` branches. Every native capability comes from Expo SDK modules or
  Expo-Go-bundled community packages (expo-video, expo-haptics, expo-image,
  expo-localization, safe-area-context, NetInfo, reanimated, react-native-svg) that support
  both platforms inside Expo Go.
- **`app.json`**: shared config plus an `ios` section (Icon Composer icon at
  `assets/expo.icon`, `supportsTablet: true`) and the pre-existing `android` adaptive icon.
  Nothing requires a dev client or prebuild.
- **Build gate** (`package.json`): `"build": "expo export --platform all"` Metro-bundles
  Android + iOS + web in one pass, on any OS. `npm run check`, the pre-push hook and CI all
  include it, so a change that breaks the iOS bundle cannot be pushed.
- **Portability guarantees**: npm scripts chain with `&&` only (no env-var prefixes, no cmd
  syntax); husky hooks are plain POSIX sh with LF endings (`.gitattributes` pins `eol=lf`);
  `forceConsistentCasingInFileNames` is explicit in tsconfig so imports match file casing
  even on case-insensitive filesystems (Windows and default macOS both are — Linux CI and
  Hermes are not); tracked filenames have no case-only collisions.

## c) Edge cases handled

- Wrong-cased import on a case-insensitive dev machine → fails `npm run typecheck`
  everywhere, not just on Linux CI.
- CRLF sneaking into hooks/scripts from a Windows editor → `.gitattributes` normalizes to
  LF at commit time, so the hooks stay executable by `sh` on macOS.
- iOS-only bundle breakage (bad platform-specific resolution, iOS-incompatible dependency
  wiring) → caught by the `--platform all` export in every gate.
- What CANNOT be caught without hardware: real-device rendering, haptics, video playback
  feel, flag-emoji glyphs, VoiceOver — listed honestly in README trade-offs and ADR 0040.

## d) How to test manually

Follow the README "How to run" matrix for your machine/target combination. On a borrowed
Mac/iPhone, this is the priority order:

1. `npm install && npm run check` — the full gate must be green on macOS.
2. `npx expo start` → `i` (Simulator) or QR scan with an iPhone (Expo Go): app boots to
   Home, lessons load.
3. Safe areas: no content under the notch/home indicator on Home, Exercise, Result.
4. Video: plays, native controls work, the quiz CTA unlocks when it ends.
5. Haptics on a physical iPhone: gentle tap feedback on presses, success buzz on pass.
6. Flags on the language tiles render as 🇹🇷/🇬🇧 (iOS renders flag emoji natively).
7. Language transition, exit sheet, error banner (airplane mode) — same behavior as
   Android.
8. VoiceOver spot check: lesson cards, answer tiles, the language radiogroup.

## e) References

- Expo CLI (`expo export`, `--platform`): https://docs.expo.dev/more/expo-cli/
- Expo Go: https://docs.expo.dev/get-started/set-up-your-environment/
- app.json / ios config: https://docs.expo.dev/versions/latest/config/app/
- Git attributes (eol): https://git-scm.com/docs/gitattributes
- TypeScript forceConsistentCasingInFileNames: https://www.typescriptlang.org/tsconfig/#forceConsistentCasingInFileNames
