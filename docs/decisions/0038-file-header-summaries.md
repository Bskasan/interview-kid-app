# 0038 — File header summaries + comment policy

Status: accepted
Date: 2026-08-20

## Context

The comment rules so far were implicit: an earlier cleanup (0021) stripped narrating comments
and ADR citations, leaving "why-only" as unwritten practice. Meanwhile nobody opening a file
for the first time — an evaluator included — could see its role without reading it whole; the
three screens (up to ~340 lines) and the biggest components had no file-level summary at all.
Two goals in tension: comments must not narrate code, yet a newcomer needs orientation.

## Decision

Every `.ts`/`.tsx` under `app/` and `src/` starts with a 2–4 line block comment stating what
the file contains and its role in the flow — _what, not how_, no import restating. This header
is the one sanctioned "what" comment; all other comments remain why-only (rationale, non-obvious
constraints, genuinely complex logic such as the timer/AppState math). A change that alters a
file's responsibility must update the header in the same change. Config files (`*.config.js`,
`jest.setup.js`) and JSON are exempt. Where a file's single export already carried a JSDoc that
was really a module summary, it was promoted to the header rather than duplicated; export JSDocs
remain only where they add caller-facing semantics beyond the header.

## Alternatives considered

- **No headers (status quo)** — keeps files minimal, but orientation lives only in docs/ and
  the reader's patience; a reviewer opening `exercise/[id].tsx` cold starts from zero.
- **Full JSDoc modules (`@module`, params everywhere)** — heavyweight ceremony for an app this
  size; the failure mode is boilerplate that drifts from the code.
- **README-per-folder** — orientation further from the code than a header, and it rots faster
  (folder READMEs aren't in the diff when a file changes).
- **Deleting all comments instead** — rejected: the codebase's why comments (Hermes quirks,
  race explanations, a11y contrast rationale) are load-bearing documentation.

## Consequences

- Every file self-describes; the sweep also deleted the remaining narrating comments
  (duplicated `reportingStorage` notes, restated effect descriptions, a name-restating color
  note) so the signal-to-noise of what remains is higher.
- Headers are a maintenance obligation: they must move with responsibility changes — enforced
  by convention and review, not tooling (a lint rule can check presence, not accuracy).
- Test files are deliberately out of scope: describe/it blocks already narrate intent.

## References

- TypeScript JSDoc reference: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
