# 0029 — Locale-safe cached data: render-time lesson titles

Status: accepted
Date: 2026-08-19

## Context

`src/api/lessons.ts` baked the display title (`"Ders 3: Ada"`) into the `Lesson` model at
fetch/map time, and that model is persisted by the React Query AsyncStorage persister for
24 h. With a language switch, every cached or persisted title would keep the old language —
on screen immediately after toggling, and across restarts until the cache expired. The API
layer also imported the strings module, coupling data fetching to presentation.

## Decision

The `Lesson` model became language-neutral: `{ id, lessonNumber, author, thumbnailUrl }`.
`mapLessons` no longer touches copy; the lesson card (since 0047, the map row and its bubble)
composes the title at render time via
`t('home:lessonTitle', { number, author })`, so a language switch re-renders every title
instantly and the persisted cache can never be language-stale. The persister `buster` was
bumped `lessons-v1 → lessons-v2`, discarding persisted entries with the old shape instead
of letting them hydrate into the new type.

## Alternatives considered

- **Invalidate the query cache on language change** — treats the symptom: refetching 20
  lessons over the network to re-run a string template wastes data and breaks offline
  switching entirely.
- **Persist titles per language (title_tr, title_en)** — doubles the persisted shape for
  every future language and still leaves the API layer writing display strings.
- **Skip the buster bump and defensively handle both shapes** — hydrating `title`-shaped
  entries into `lessonNumber/author` code means undefined titles for up to 24 h; a one-time
  cache discard on a placeholder list is strictly cheaper than shape-migration code.

## Consequences

- The mapper is presentation-free — the "skip malformed items" policy (0009) now yields a
  model with zero locale coupling, and the API layer imports nothing from the UI layers.
- First launch after this update refetches the list once (cache busted). Offline users with
  only a v1 cache see the error state until they reconnect — same as any cold cache.
- Tests assert `lessonNumber`/`author` instead of rendered Turkish titles, so copy edits no
  longer break API tests.

## References

- TanStack Query persistQueryClient (buster, maxAge): https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
