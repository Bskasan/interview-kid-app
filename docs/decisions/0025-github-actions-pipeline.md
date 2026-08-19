# 0025 — GitHub Actions CI pipeline

Status: accepted
Date: 2026-08-19

## Context

Local hooks can be bypassed (`--no-verify`) and prove nothing to a reviewer. The same gate
suite needs to run on neutral hardware for every PR into `main` and on every push to
`main`, and "main always builds" needs an artifact as evidence.

## Decision

One workflow (`.github/workflows/ci.yml`), one job `ci`, on `pull_request` targeting
`main` and `push` to `main`: checkout → setup-node (current LTS, npm cache) → `npm ci` →
`typecheck` → `lint` → `format:check` → `test` → `build` (`expo export --platform android`).
Steps are ordered fastest-failing first and a single sequential job is inherently
fail-fast — a type error stops the run before the multi-minute export. `concurrency` keyed
on the ref with `cancel-in-progress` kills superseded runs on force-push. On `main` pushes
the exported bundle is uploaded as an artifact (14 days): the post-merge proof that main
exports cleanly. The export needs no Expo account or secrets.

## Alternatives considered

- **EAS Build as the CI build step** — produces a real binary but requires an Expo account,
  a token secret, and paid/queued build minutes; for a take-home the question "does the
  bundle compile?" is answered by `expo export` in-runner for free. EAS is the production
  path and is noted in the README trade-offs.
- **Matrix / parallel jobs per check** — parallel jobs each pay `npm ci` (~1 min) to save
  seconds of sequential lint/format time, and required-status bookkeeping multiplies. One
  job, one required check.
- **Also triggering on `dev` pushes** — the working branch is guarded by the local
  `pre-push` hook running the same suite; CI on every WIP push would double-spend minutes
  for no additional signal. PRs from `dev` get CI before merge.
- **Caching `node_modules` directly** — `actions/setup-node`'s npm cache (keyed on the
  lockfile) is the supported approach; raw `node_modules` caches break across Node versions.

## Consequences

- Every PR to `main` shows the full gate suite as a single required-check context (`ci`),
  which 0026's ruleset references.
- The android export runs on every CI pass (~minutes); acceptable at this scale, and it is
  the only step that proves the Metro bundle actually builds.
- `node-version: lts/*` tracks the current LTS automatically; a Node LTS rollover could
  surface new warnings in CI first — visible, and pinnable to a major if it ever bites.

## References

- GitHub Actions workflow syntax: https://docs.github.com/en/actions
- setup-node (npm caching): https://github.com/actions/setup-node
- Expo CLI export: https://docs.expo.dev/more/expo-cli/
