# 0048 — Versioned persistence for progress (stars stay derived)

Status: accepted (amends 0005's persistence setup)
Date: 2026-08-20

## Context

The map trusts every stored star count for unlocking, but the persisted progress written by
earlier rounds was never validated on the way OUT of storage — a corrupt or hand-edited record
(inflated `best`, badge inconsistent with the score, junk entries) would feed the unlock chain
garbage. Until now the repo versioned stores by renaming the key (`-v1` suffix); no store had
zustand's `version`/`migrate` machinery, and renaming the progress key would silently delete a
child's earned badges.

## Decision

`progressStore` keeps its key (`progress-v1`) and adopts **zustand persist versioning**:
`version: 1` with an exported, unit-tested `migrateProgress(persisted, fromVersion)`. Legacy
payloads (implicit v0) are normalized once at rehydration: non-object entries dropped, `total`
must be a positive finite number, `best` clamped into `[0, total]`, and the badge recomputed
via `computeOutcome` when the stored one is inconsistent. Same-version payloads pass through
untouched.

**Stars are derived, never stored.** `lessonStars(result)` ≡ clamped `best` — storing a
separate `stars` field would duplicate `mergeResult`'s source of truth and invite drift; the
star model is presentation over existing data (0010), so the schema doesn't change at all.
The version bump's value is the normalization pass plus establishing the migration pattern for
future schema changes.

## Alternatives considered

- **Bump the key (`progress-v2`)** — the established pattern here, but it orphans real user
  data; acceptable for a lessons _cache_ (0008's buster), unacceptable for earned progress.
- **Store an explicit `stars` field via migration** — makes the map's read trivial but creates
  two writable truths (`best` and `stars`) that every future write path must keep in sync.
- **Validate at read time instead (defensive `lessonStars` only)** — `lessonStars` does clamp,
  but read-time-only validation re-pays the cost on every render forever and leaves garbage
  entries in storage; the migration cleans once and the clamp remains as a second layer.
- **No versioning (trust old data)** — the unlock chain would obey any inflated `best`,
  unlocking everything; exactly the class of bug the map introduces.

## Consequences

- Old installs keep every legitimate result; corrupt entries silently normalize once.
- The repo now has a worked example of `version`/`migrate` for the next schema change.
- `migrateProgress` is exported solely for testability (zustand exposes no handle on the
  configured migrate) — a small API-surface cost.
- Read paths still clamp (`lessonStars`), so even a post-migration write bug cannot crash the
  map.

## References

- zustand persist (version / migrate): https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md
