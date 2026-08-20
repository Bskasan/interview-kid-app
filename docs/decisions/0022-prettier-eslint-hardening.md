# 0022 — Prettier and ESLint hardening

Status: accepted
Date: 2026-08-19

## Context

Round 2 wired a working ESLint flat config, but formatting was still whatever the editor
produced, and three high-value rules were missing: nothing stopped a stray `console.log`,
an `any`, or a stale hook dependency from landing. With git hooks and CI arriving in this
round, formatting and lint policy must be machine-decidable — a human "looks fine" is not a
gate.

## Decision

Add Prettier as the single formatting owner (`printWidth: 100`, `singleQuote`,
`trailingComma: "all"`, `semi: true` — matching the de-facto style of the existing code, so
the one-time reformat is minimal) with `eslint-config-prettier/flat` appended last in the
ESLint config so no lint rule ever fights the formatter. Harden ESLint with
`no-console: error` (all logging must go through the future central logger),
`@typescript-eslint/no-explicit-any: error` (promotes the CLAUDE-era convention to a gate),
and `react-hooks/exhaustive-deps: error` (React Compiler is enabled; stale deps are real
bugs here). Rely on Prettier's default `endOfLine: "lf"` and add a `.gitattributes` with
`* text=auto eol=lf`: the index already stores LF everywhere, and forcing LF working copies
stops Windows `core.autocrlf` from flipping checkouts to CRLF and failing `format:check`.
The mechanical reformat of the repo ships as its own `style:` commit — this record covers
the decision; that commit is only its application, so reviewers can skip it.

## Alternatives considered

- **`eslint-plugin-prettier` (Prettier as a lint rule)** — runs Prettier inside ESLint and
  reports style as lint errors; slower, noisier diffs in editors, and the Prettier team
  itself recommends running the formatter directly. Separate tools, separate jobs.
- **No Prettier, style rules via ESLint** — stylistic lint rules are deprecated upstream and
  can't guarantee idempotent output; formatting stays reviewable opinion instead of a fact.
- **`endOfLine: "auto"`** — keeps the check green regardless of line endings, but allows
  CRLF/LF drift between contributors and machines; pinning LF + `.gitattributes` makes the
  repository deterministic instead of tolerant.
- **Warn instead of error for the three rules** — warnings don't fail `npm run check`, so
  they would be noise, not a gate.

## Consequences

- Formatting disputes end: `format:check` is binary, and the editor config no longer
  matters.
- One `style:` commit adds churn to `git blame`; acceptable once, which is why the config
  and the reformat are separate commits.
- `no-console: error` requires the central logger (added with error handling) to carry a
  justified `eslint-disable` — the single sanctioned console site.
- New contributors on Windows get LF working copies via `.gitattributes` without touching
  their global git config.

## References

- Prettier options: https://prettier.io/docs/options
- eslint-config-prettier (flat config usage): https://github.com/prettier/eslint-config-prettier
- Expo ESLint guide: https://docs.expo.dev/guides/using-eslint/
