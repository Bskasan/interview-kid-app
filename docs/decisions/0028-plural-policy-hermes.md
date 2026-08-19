# 0028 — Plural policy and the Hermes Intl.PluralRules polyfill

Status: accepted
Date: 2026-08-19

## Context

Turkish uses one grammatical form for counted nouns ("15 saniye", "1 saniye"), so the
original copy needed no plural machinery. English does not: the timer's accessibility label
would read "1 seconds left" without plural handling. i18next's v4 JSON format resolves
`_one`/`_other` suffix keys through `Intl.PluralRules`, which the i18next docs explicitly
note Hermes still does not implement — and since i18next v24 there is no non-Intl fallback.

## Decision

Exactly one string uses plural keys: `exercise.timeLeft_one` / `timeLeft_other`
(`{{count}} second/seconds left`). The Turkish file defines **both** keys with the identical
string — CLDR Turkish does have a `one` category, and defining both keeps the tr/en
key-parity test symmetric. Everything else stays plain interpolation. `src/i18n/index.ts`
loads the `intl-pluralrules` polyfill behind a runtime guard
(`typeof Intl.PluralRules === 'undefined'`): on Hermes the polyfill installs; in Node (jest)
and any future runtime with native support it never executes. The device checklist verifies
"1 second left" vs "2 seconds left" in English.

## Alternatives considered

- **Avoid plurals entirely (e.g. "Seconds left: 1")** — dodges the dependency but bends the
  copy around an engine limitation; kid-facing English should read naturally.
- **Hand-rolled `count === 1` branching at call sites** — spreads grammar logic into
  components and silently breaks for any future language with more than two forms.
- **`@formatjs/intl-pluralrules`** — equivalent and well-maintained, but requires the
  companion `Intl.Locale`/`getCanonicalLocales` polyfills on Hermes; `intl-pluralrules` is
  self-contained with bundled CLDR rules.
- **Unconditional import** — simpler line, but would shadow a future native implementation;
  the guard documents intent and costs one `typeof` check.

## Consequences

- The polyfill ships in the bundle either way (Metro bundles conditional requires); it just
  doesn't _execute_ where native support exists.
- Any future plural-sensitive string must add both suffix keys in both languages — the
  parity test enforces the symmetry automatically.

## References

- i18next plurals (needs Intl.PluralRules; Hermes gap called out): https://www.i18next.com/translation-function/plurals
- intl-pluralrules polyfill: https://github.com/eemeli/intl-pluralrules
