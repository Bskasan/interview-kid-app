# 0030 — Question content model: ids + questions namespace, derived shape labels

Status: accepted
Date: 2026-08-19

## Context

`src/data/questions.ts` held a second body of Turkish copy outside `strings.ts`: 15 prompts,
dozens of option labels, and two lookup maps (`TURKISH_COLOR`, `TURKISH_SHAPE`) whose
adjective-noun composition (`"${color} ${shape}"`) hardcoded Turkish word order. Question
sets were anonymous array entries with no ids, so there was nothing stable to key a
translation on.

## Decision

The data file became language-neutral structure: sets and questions got stable ids
(`shapes|colors|counting|animals|objects` × `q1..q3`), and all text moved into the
`questions` i18n namespace. Options carry typed keys (`labelKey`/`a11yKey`) whose type —
a dot-path union derived from `tr.json` — makes a key that doesn't exist in the resource
file a **compile error**. Drawn-shape options carry no key at all: their spoken label is
derived through the `questions:shapeOption` template (`"{{color}} {{shape}}"`), with color
and shape names resolved from token-keyed entries — so word order lives in each language's
template, and the template-literal key type (`color.${ColorToken}`) keeps the old
"a new color token forces a name" exhaustiveness, now per language. Digit options ("2",
"3", …) also live in the JSON, identical in both files, so the "no hardcoded user-facing
string" audit has zero exceptions in data. Visuals and `correctIndex` stay shared in TS.
`optionLabel(option, t)` / `optionA11yLabel(option, t)` are the only accessors; the
data-integrity tests now run per locale (prompt resolves, four unique spoken labels).

## Alternatives considered

- **Parallel translated data files (questions.tr.ts / questions.en.ts)** — duplicates the
  structure (options, correctIndex) per language; a divergence in `correctIndex` between
  files would be a silent correctness bug, exactly the class of error shared structure
  prevents.
- **Keys as plain strings, integrity via tests only** — works, but the dot-path union costs
  ~10 lines of types and turns a typo into a red squiggle instead of a test failure.
- **Keeping label composition in TS with per-language maps** — re-implements i18next
  interpolation and keeps word order in code; the template approach moves it to content,
  where a translator can fix it.

## Consequences

- Adding a language = translating one JSON block; the question structure is untouched.
- Adding a question requires touching data + both locale files; the compile-time key check
  and the per-locale integrity test both fail loudly if any side is forgotten.
- Digit options being translatable is slightly odd, but keeps the audit absolute and would
  matter for scripts with their own numerals.

## References

- i18next interpolation: https://www.i18next.com/translation-function/interpolation
- i18next TypeScript (typed keys): https://www.i18next.com/overview/typescript
