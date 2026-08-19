# 0018 — Phase 4 interaction & display hardening

Status: accepted
Date: 2026-08-19

## Context

The a11y/edge-case sweep surfaced four small holes: (1) coral/gray text shades failed the 4.5:1
contrast rule on the cream background; (2) huge system font scales could clip text inside
fixed-height cards and buttons; (3) a fast double-tap on a Home card pushed two Exercise
screens (and Result buttons could double-replace); (4) `AppState.currentState` can be `unknown`
at cold start, which our "active only when 'active'" logic read as *backgrounded* — video
autoplay and the timer could stick paused with no change event to unstick them.

## Decision

- **Contrast**: `muted` darkened `#8C8C8C` → `#6E6E6E` (≥4.5:1 on cream *and* white; the token's
  role is unchanged — amendment noted in ADR 0006). The timer's seconds stay `ink` at all
  urgency levels: urgency is already shown by the bar's color/width and the number's value, and
  coral text cannot pass 4.5:1 on cream.
- **Font scaling**: `maxFontSizeMultiplier={1.4}` on text inside fixed-height/fixed-line
  components (chunky button labels, lesson-card title/stars/pill, answer options, timer digits,
  question counter). Free-flowing text (titles, prompts, mascot speech) scales without a cap.
- **Navigation locks**: a ref-based once-lock around Home's `router.push` (reset via
  `useFocusEffect` when Home regains focus) and Result's `router.replace` buttons (screen
  unmounts, no reset needed). Quiz answers were already race-proof via the pure state machine.
- **App-active default**: only explicit `background`/`inactive` count as "not active";
  `unknown`/startup states count as active.

## Alternatives considered

- **allowFontScaling={false}** — kills clipping *and* accessibility; a capped multiplier keeps
  large-text users readable while protecting fixed layouts.
- **Debounce/throttle timers for double-taps** — time-based guesses; a focus-scoped lock is
  deterministic and cannot eat a legitimate second visit.
- **Coral urgent digits with a lighter track** — juggling shades to keep a failing color;
  dropping color-coding from the *text* (bar keeps it) is simpler and honest to the
  "never color alone" rule, which the countdown number already satisfies by being a number.
- **Treating `unknown` app state as inactive (status quo)** — "safe" only in theory: nothing
  re-emits an event when the state was actually active all along, so the UI could stay frozen.

## Consequences

- All text now passes 4.5:1 on its actual backgrounds; the palette keeps its roles.
- At extreme font scales some labels ellipsize instead of overflowing; full text remains
  available to screen readers via accessibility labels.
- Rotation needs no handling: `app.json` locks `orientation: "portrait"` (template default we
  keep deliberately for a kids app).

## References

- Pressable/Text accessibility & font scaling props: https://reactnative.dev/docs/pressable
- AppState states: https://reactnative.dev/docs/appstate
