# 0039 — Visual language switch: flag tiles + animated transition + lint enforcement

Status: superseded by 0043 (the flag-tile control; the transition ceremony, flag-emoji stance
and lint enforcement decided here stand — 0043 replaces only the tiles with a single toggle.
This record had superseded 0031's toggle design; detection/persistence in 0031 still stand)
Date: 2026-08-20

## Context

The text-pill toggle assumed a reader. The target user is 5–8 and often pre-reading — the
round-4 spec asks for a kid-first, visual switch and for the language change itself to feel
like a moment rather than an instant reskin mid-glance. Constraints: reanimated only (no new
runtime libraries), `setLanguage`'s synchronous contract is load-bearing (store tests assert
it), and reduced motion must bypass any decoration.

## Decision

**Tiles.** `LanguageSwitch` replaces `LanguageToggle` (deleted): two ≥64dp square tiles, flag
emoji over the language's own name (🇹🇷 Türkçe / 🇬🇧 English). Selection = primary border +
✓ badge + `accessibilityState` carrying both `checked` (radio convention) and `selected`;
border width identical in both states so selection never shifts layout. The flag lives in an
isolated `Flag` subcomponent so a bundled-SVG fallback (react-native-svg is already a
dependency) is a one-function swap if a device renders flags as letter pairs. 0031 rejected
flags ("countries, not languages") — reversed knowingly: for a two-language kids' app,
instant recognizability for a pre-reader outweighs the semantic imprecision, and the endonym
under each flag keeps the unambiguous signal too.

**Transition.** Tapping the other tile does not change the language; it writes the target
into a transient zustand store (`languageTransitionStore`, errorStore pattern, `begin`
idempotent). A root-sibling overlay (above the error banner: zIndex 20/8 vs 10/6) fades in
over the whole app, bounces the mascot with a line shown in the _target_ language
(`getFixedT(target)` — frozen per transition via `key={pending}`), calls `setLanguage` via a
plain JS timer at 300 ms **under full opacity**, fades out, and unmounts at 850 ms. Timers,
not animation-completion callbacks: no `runOnJS` precedent exists in the codebase, the swap
must happen even if a frame drops, and fake-timer tests can assert every step. Interaction is
blocked three ways: the opaque absolute-fill swallows touches, tiles are disabled while
pending, and `begin` is a no-op mid-transition. Reduced motion: the switch calls
`setLanguage` directly — instant swap, the overlay never mounts (plus a defensive instant
path in the overlay itself).

**Enforcement.** `eslint-plugin-i18next` (dev-only) with `flat/recommended` defaults, scoped
to `app/**` + `src/**`. The spike found exactly one violation on the whole codebase — a ✓
glyph — because the defaults already ignore emoji-only strings and checked attributes are out
of scope in `jsx-text-only` mode. Adopted as-is with zero option overrides; the glyph moved
to a named constant (the AnswerTile badge-glyph pattern). The rule guards visible JSX text;
a11y-label coverage stays with review + the parity test.

## Alternatives considered

- **Text-only toggle (status quo)** — unambiguous but demands reading; rejected by the spec's
  kid-first requirement.
- **Globe icon / single cycling button** — language-neutral but meaningless to a child;
  cycling also hides how many options exist.
- **🇺🇸 for English** — the app's English is not US-specific; 🇬🇧 chosen arbitrarily among
  anglophone flags and documented as such. Same country≠language caveat either way.
- **Modal-based overlay (ExitConfirmSheet pattern)** — needs `onRequestClose` plumbing to
  no-op and a separate native window that complicates test assertions; a root sibling is the
  GlobalErrorBanner precedent and trivially testable.
- **`runOnJS` animation-completion sequencing** — couples the swap to animation internals; a
  dropped frame or a paused UI thread would delay or lose the language change.
- **Deferring `setLanguage` inside the store** — breaks the synchronous contract the
  settingsStore tests assert; sequencing belongs to the UI layer that wants it.
- **Grep-only enforcement (no plugin)** — was the fallback if the plugin was noisy; the spike
  measured one flag repo-wide, so the standing lint gate wins over a documented manual step.

## Consequences

- Changing language now takes ~850 ms by deliberate design — a README trade-off note.
- The overlay covers the error banner for that sub-second; the banner persists and is
  visible after fade-out (comment updated at the banner's zIndex).
- App backgrounded mid-transition: JS timers pause and resume on foreground — the sequence
  self-heals; if the app is killed inside the 300 ms window, the choice simply wasn't saved
  and the child re-taps. No AppState code needed.
- Android back during the overlay: Home is the stack root, so back backgrounds the app —
  harmless, covered by the row above.
- Flag rendering on specific devices is the headline device-checklist item; the SVG fallback
  path is pre-isolated but not pre-built.

## References

- Reanimated withTiming/withRepeat/useReducedMotion: https://docs.swmansion.com/react-native-reanimated/
- i18next getFixedT / changeLanguage: https://www.i18next.com/overview/api
- eslint-plugin-i18next: https://github.com/edvardchen/eslint-plugin-i18next
- RN AccessibilityState: https://reactnative.dev/docs/accessibility#accessibilitystate
