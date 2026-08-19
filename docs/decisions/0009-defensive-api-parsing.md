# 0009 — Defensive parsing of the lessons API

Status: accepted
Date: 2026-08-19

## Context

Home data comes from a public API we do not control (picsum.photos). The response is `unknown`
until proven otherwise; a schema change, a partial outage or a proxy error page must never crash
a kids app. TypeScript's `strict` mode types the payload, but only runtime checks make it true.

## Decision

A hand-rolled mapper (`mapLessons` in `src/api/lessons.ts`) treats the payload as `unknown` and
narrows field by field. Policy: **a malformed item is skipped, a malformed payload becomes `[]`**
— never a throw from the mapper. Extras: duplicate ids are dropped (FlatList keys must be unique)
and lesson numbering ("Ders N") is assigned after filtering, so skipped items never leave gaps.
Network-level failures (non-2xx, timeout via `AbortController`) do throw, because React Query
needs a rejected promise to drive the error/retry state.

## Alternatives considered

- **Trust the API shape (cast to `PicsumItem[]`)** — least code, but one `null` author from the
  API becomes `undefined` rendering or a crash at runtime; exactly the silent failure class this
  assignment penalizes.
- **zod (or io-ts/valibot) schema validation** — great DX and error messages, but a new dependency
  and bundle weight to validate two fields of one endpoint; the hand-rolled guard is ~30 lines and
  unit-tested. At production scale with many endpoints, zod would win — noted below.
- **Fail hard on any malformed item** — simpler policy, but throws away 19 good lessons because
  one item is broken; skipping degrades gracefully and the child still gets content.

## Consequences

- The mapper is pure and unit-tested against valid, partial, duplicate-id and garbage payloads.
- An empty mapped list is a real state the UI must handle (Home shows the empty state with retry).
- If the API evolves, the mapper is the single place to update; with more endpoints we would
  switch to zod schemas shared with tests.

## References

- picsum.photos API (list endpoint, sized image URLs): https://picsum.photos/
- TanStack Query error handling relies on rejected promises: https://tanstack.com/query/latest/docs/framework/react/react-native
