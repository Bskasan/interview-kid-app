# 0027 — i18next with bundled synchronous init and compile-time typed keys

Status: accepted
Date: 2026-08-19

## Context

All copy lived in `src/lib/strings.ts` as a Turkish `as const` object — centralized, but
single-language, with six function-valued entries doing ad-hoc interpolation. Round 3
requires Turkish + English with a runtime switch, JSON resources, and unknown keys failing
`tsc`. The app runs in Expo Go on Hermes, so any solution must be pure JS.

## Decision

`i18next` + `react-i18next` + `expo-localization` (all Expo Go-compatible; expo-localization
is SDK-pinned via `npx expo install`). One JSON file per language (`src/locales/tr.json`,
`en.json`) whose top-level keys are the six namespaces (`common`, `home`, `exercise`,
`result`, `errors`, `questions`) — the parsed file is passed directly as the language's
resource object. Init in `src/i18n/index.ts` is **synchronous** (`initAsync: false`, bundled
resources, imported first in `app/_layout.tsx`), so no Suspense, no loading gate, and no
per-test async setup. Type safety comes from `CustomTypeOptions { defaultNS; resources: typeof tr }`
in `src/i18n/i18next.d.ts` — every `t()` key is checked against the Turkish file, and the
function-valued strings became `{{placeholder}}` interpolation keys. A jest suite enforces
tr/en key parity, non-empty values, and per-key placeholder equality, so "compiles" plus
"tests pass" together mean "no missing or broken translation".

## Alternatives considered

- **Hand-rolled React context over the JSON files** — no dependency, but re-implements
  interpolation, plural rules, language change notification and typing; i18next is the
  boring, documented standard and the interview question "why i18next" is easier to defend
  than "why a bespoke i18n runtime".
- **react-intl (FormatJS)** — ICU MessageFormat is more powerful, but heavier, needs more
  polyfills on Hermes, and its extraction workflow is overkill for ~90 strings.
- **Async init with language detector plugin** — the standard web setup; on native it adds
  a first-frame race (or a splash gate) for zero benefit when resources are bundled and the
  "detector" is one `getLocales()` call.
- **Per-namespace resource files (12 files)** — more conventional at scale, but doubles the
  file count for no lookup benefit here; one file per language keeps parity reviews to a
  single side-by-side diff.

## Consequences

- Adding a string = add it to both JSON files (the parity test fails otherwise) and use the
  typed key; a typo is a compile error, not a blank label on a child's screen.
- Both languages ship in the bundle (~a few KB) — right trade-off at this size; a
  many-language production app would lazy-load namespaces instead.
- `typeof tr` makes Turkish the schema: English can never silently gain or lose keys.

## References

- i18next configuration options: https://www.i18next.com/overview/configuration-options
- i18next TypeScript (CustomTypeOptions): https://www.i18next.com/overview/typescript
- react-i18next useTranslation: https://react.i18next.com/latest/usetranslation-hook
- expo-localization (Expo Go supported): https://docs.expo.dev/versions/latest/sdk/localization/
