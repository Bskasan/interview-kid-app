# 0031 — Language detection and persisted override

Status: accepted (toggle design superseded by 0039; detection/persistence unchanged)
Date: 2026-08-19

## Context

The initial language must come from the device (a Turkish child should never see English
first), but an explicit choice — e.g. a bilingual family switching on purpose — must win on
every later launch. The choice needs a home the child can find (Home header) and semantics
a screen reader can announce.

## Decision

On boot, `src/i18n` maps `expo-localization`'s first locale to `tr | en`, defaulting to
`tr` (the product's home market and the fallback language). A new persisted zustand store
(`src/store/settingsStore.ts`, key `settings-v1`, AsyncStorage, partialized to
`{ language }`) records the explicit choice: `setLanguage` updates the store **and** calls
`i18n.changeLanguage`, and `onRehydrateStorage` re-applies a stored choice that differs
from the boot language. Cold start therefore may flash the device language for a sub-second
until hydration lands — accepted and documented, instead of gating every launch behind a
blank hydration wait to serve the rare mismatch case. The UI is `LanguageToggle` in the
Home header: a two-segment pill ("Türkçe" / "English", each language in its own name, 48dp
segments, `radiogroup`/`radio` roles with `checked` state, selection carried by fill + bold,
not color alone). react-i18next re-renders every subscribed component immediately — no
restart.

## Alternatives considered

- **Persist into the i18n layer itself (i18next language detector plugin with an
  AsyncStorage cache)** — hides app state inside library config; the zustand store keeps
  "user chose X" a first-class, testable piece of app state alongside progress.
- **Gate the UI on settings hydration** — eliminates the flash but adds a blank frame to
  every cold start for every user; the flash only occurs when device language ≠ stored
  choice.
- **Language in a settings screen** — out of proportion for one toggle, and the brief's
  round-3 spec explicitly places it on the Home header where a parent can reach it in one
  tap.
- **Flag emojis on the toggle** — flags map to countries, not languages; each language's
  own name is unambiguous and matches platform conventions.

## Consequences

- `language: null` cleanly means "follow the device": a user who never touches the toggle
  tracks device-language changes; touching it once pins the app until changed again.
- The toggle is not gated behind a parental barrier — noted in README trade-offs (a child
  can flip languages; harmless, reversible in one tap).
- The store is the natural place for future settings (sound on/off, reduced stimulation).

## References

- expo-localization getLocales: https://docs.expo.dev/versions/latest/sdk/localization/
- zustand persist middleware (partialize, onRehydrateStorage): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
- i18next changeLanguage / instance API: https://www.i18next.com/overview/api
