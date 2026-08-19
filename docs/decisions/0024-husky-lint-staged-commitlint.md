# 0024 — Husky + lint-staged + commitlint as local gates

Status: accepted
Date: 2026-08-19

## Context

The quality bar (`typecheck`, `lint`, `format:check`, `test`, `build`) only matters if it
cannot be skipped by habit. The repo is developed on Windows (Git Bash provides `sh` for
hooks), commits follow Conventional Commits by convention only, and until now nothing ran
before a commit or push. Server-side enforcement is unavailable on this plan (see 0026), so
the local hooks are the enforced gate.

## Decision

Husky v9 manages the hooks (`"prepare": "husky"` installs them on `npm install`); hook
files are plain POSIX `sh` one-liners with no bashisms so Windows Git Bash runs them
unchanged. `pre-commit` runs lint-staged (eslint --fix + prettier --write on staged
`ts/tsx/js`, prettier on `json/md` — ESLint never parses non-code files) followed by
`npm run typecheck`; `commit-msg` runs commitlint with `@commitlint/config-conventional`;
`pre-push` runs the full `npm run check`, so nothing that fails a gate can leave the
machine. Fast checks run per-commit, the expensive full suite once per push.

One machine-specific gotcha is recorded here: this machine has a **global**
`core.hooksPath=.husky` left by an older setup. Husky v9 sets a repo-local
`core.hooksPath=.husky/_` which overrides it, and the `prepare` script guarantees the same
for any fresh clone — the setup does not depend on the global value.

## Alternatives considered

- **lefthook** — faster (Go binary) and config-in-one-file, but another binary dependency
  and a second config dialect; husky is the ecosystem default, and our hooks spend their
  time in npm scripts anyway, so the runner's speed is irrelevant.
- **simple-git-hooks** — minimal, but hooks are limited to single package.json one-liners
  and re-installation on change is manual (`npx simple-git-hooks` after every edit);
  husky's file-per-hook model is more transparent in review.
- **Raw `.git/hooks`** — not versioned, silently absent on fresh clones; exactly the
  failure mode gates must not have.
- **Full `check` on pre-commit** — the android export takes minutes; developers would
  start committing with `--no-verify`, which is worse than a lighter hook.
- **Typecheck via lint-staged only on staged files** — `tsc` on a file subset is unsound
  (type errors are cross-file); the whole-project typecheck is the correct unit and costs
  seconds here.

## Consequences

- A failing lint rule, type error, bad commit message, or failing test/build refuses the
  commit or push locally; `--no-verify` remains an explicit, visible escape hatch.
- Every push pays the full `check` (including the export). Acceptable for this repo size;
  at production scale the build step would move to CI-only.
- lint-staged may rewrite staged files (`--fix`/`--write`); partial-staged hunks are
  handled by lint-staged's own stash dance.

## References

- Husky: https://typicode.github.io/husky/
- lint-staged: https://github.com/lint-staged/lint-staged
- commitlint: https://commitlint.js.org/
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
