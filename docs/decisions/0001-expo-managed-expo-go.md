# 0001 — Expo managed workflow + Expo Go

Status: accepted
Date: 2026-08-19

## Context

The take-home (~1–2 days) is developed on **Windows** and tested on a **physical Android phone**;
there is no Mac available, so iOS cannot be built or tested locally. The evaluation focuses on
flow correctness, edge cases and decisions — not on custom native code. We need the fastest
possible edit → on-device feedback loop with zero native toolchain risk.

## Decision

Use the Expo **managed workflow** (latest SDK, currently 57) and require the app to run in
**Expo Go**. Every dependency must be either pure JavaScript or a native module already bundled
in Expo Go. No config plugins that require a custom native build.

## Alternatives considered

- **Bare React Native (RN CLI)** — full native control, but requires Android Studio/Gradle builds
  for every native change, is slower to iterate on Windows, and gives no path to even glance at
  iOS without a Mac. All the flexibility it buys is unused in this scope.
- **Expo development build (custom dev client)** — unlocks any native library (e.g. MMKV) while
  keeping the Expo DX, but requires an EAS cloud build or a local Gradle build before the first
  run. That is setup cost and risk with zero benefit here: nothing in the brief needs a native
  module outside Expo Go's set.

## Consequences

- Instant testing: `npx expo start` + QR scan in Expo Go; no native toolchain on the dev machine.
- Library choices are constrained to the Expo Go-compatible set (this ruled out MMKV for storage,
  see 0005). Each new dependency is checked for Expo Go compatibility before install.
- iOS remains untested (documented in README); the JS-only code and Expo SDK modules used are
  cross-platform, so risk is limited but real.
- At production scale we would switch to development builds + EAS Build/Submit/Updates; Expo Go is
  a development tool, not a distribution channel.

## References

- Expo Go setup: https://docs.expo.dev/get-started/set-up-your-environment/
- Development builds (the rejected alternative): https://docs.expo.dev/develop/development-builds/introduction/
- create-expo-app: https://docs.expo.dev/more/create-expo/
