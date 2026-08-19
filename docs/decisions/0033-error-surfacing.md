# 0033 — Error surfacing: single-slot banner, silent policy, root ErrorBoundary

Status: accepted
Date: 2026-08-20

## Context

With a central handler in place (0032), the open questions were where errors surface, how
many at once, and how not to tell the child the same bad news twice — Home's error state
and the video failure path already have dedicated, friendlier UI.

## Decision

Three surfaces, each with one job. (1) `GlobalErrorBanner`, mounted once in the root
layout: a calm top banner — mascot, one generic translated line, a big "Tamam", plus
"Tekrar dene" only when the error carries a `retry` action. The store behind it holds a
**single slot, replace-on-new**: for a child, the newest message wins; a queue of stacked
banners is scarier and less useful. No blocking modal exists — every genuinely blocking
failure already has a full-screen state. (2) The **double-surfacing policy**: call sites
whose screen already renders the failure (lessons query, video failure, image fallbacks)
report with `severity: 'silent'` — logged, never bannered. Banner-worthy are only failures
with no dedicated UI: storage write/rehydrate problems, i18n init failure. (3) A root
`ErrorBoundary` exported from `app/_layout.tsx` (the documented Expo Router convention)
catches uncaught render/effect throws with a kid-friendly full-screen fallback (mascot +
"Bir şeyler ters gitti" + "Ana Sayfa"), reporting through the same funnel. If i18next
itself failed to initialize, the banner and boundary fall back to one hardcoded Turkish
constant (`fallbackText.ts`) — the single documented exception to the no-hardcoded-strings
audit, for the moment `t()` cannot be trusted.

## Alternatives considered

- **Error queue with sequential banners** — precise for developers, noise for a
  five-year-old; the log keeps the full sequence, the child sees only the latest.
- **Blocking modal for storage errors** — nothing the child can decide differently;
  a dismissible banner informs without trapping.
- **Toast library** — a dependency for what one absolutely-positioned animated view does
  within the design system (and most toast libs want gesture-handler roots).
- **Bannering query failures too** — Home already shows a full-screen retry state when
  there's no data, and deliberately keeps cached data on a failed background refetch;
  a banner would either duplicate or contradict that policy (0008).

## Consequences

- Exactly one error can be on screen; a burst of failures reads as one calm message while
  the log keeps every entry.
- The banner renders above every screen from the root layout — no per-screen wiring, and
  no screen can forget it.
- The ErrorBoundary replaces the dev red-screen in production paths; its "Ana Sayfa"
  action calls `retry()` and routes home, so even a sticky crash lands somewhere safe.

## References

- Expo Router error handling (ErrorBoundary export, props): https://docs.expo.dev/router/error-handling/
- TanStack QueryCache onError: https://tanstack.com/query/latest/docs/reference/QueryCache
