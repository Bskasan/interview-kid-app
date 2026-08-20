# 0043 — Single-toggle language switch with a flag knob

Status: accepted (supersedes 0039's tile design; 0039's transition ceremony, flag-emoji stance
and lint enforcement stand, as does 0031's detection/persistence)
Date: 2026-08-20

## Context

Round 4 shipped two flag tiles (0039). Round 5 replaces them with a single compact toggle,
modeled on a provided reference image (a neumorphic EN/JP flag-knob switch — inspiration only,
stock asset, nothing copied): one pill track, fixed language-code labels flanking it, and a
circular knob carrying a flag that slides between the ends. Constraints unchanged: reanimated
only, `setLanguage`'s synchronous contract is load-bearing, reduced motion bypasses all
decoration, and the round-4 overlay ceremony must stay untouched.

## Decision

**One control, one gesture.** `LanguageSwitch` becomes a single `Pressable`: a 110×52dp pill
track (surface + 2dp border) flanked by fixed "TR" / "EN" code labels (outside the track, per
the reference), and a 60dp knob that overhangs the track by 4dp and slides 0 ↔ 50dp with
`withSpring(motion.spring)` (~300ms, inside the requested 250–350ms band; reduced motion jumps).
Tapping anywhere on the control toggles to the other language through the **unchanged** round-4
flow: reduced motion → `setLanguage` directly; otherwise `languageTransitionStore.begin(next)`
and the overlay ceremony does the swap at its 300ms mark.

**Knob shows the CURRENT language; end labels disambiguate.** A knob can honestly show either
the current state or the tap target — genuinely ambiguous on a two-state switch. Chosen:
current (like the reference), because a pre-reader identifies "my language" by the flag they
know; the fixed TR/EN end labels plus the bold-ink-vs-muted treatment of the current side give
readers the state redundantly, and the spoken label says both state and action. The knob's
position is driven by `pending ?? active`, so the slide starts on the tap itself, before the
overlay covers the screen.

**Flag swaps at mid-slide with no timers.** Two stacked flag texts crossfade via a worklet
`interpolate` over knob progress 0.42–0.58 (clamped) — frame-exact at the halfway point,
survives interrupted springs, no `runOnJS`, no `setTimeout`. The `Flag` subcomponent stays
isolated for the pre-planned SVG fallback (0039).

**Double-tap = one toggle.** `pending` is written synchronously and `begin` is idempotent, so
the second tap of a rapid double-tap sees `transitioning` and no-ops; the control is also
`disabled` with `accessibilityState {disabled, busy}` for the whole ceremony.

**Role: button, not switch.** `accessibilityRole="switch"` announces on/off — false semantics
when neither language is an "off" state, and TalkBack would say "on"/"off" instead of names.
A button with an explicit translated label ("Dil: Türkçe. İngilizceye geçmek için dokun." /
"Language: English. Tap to switch to Turkish.", keyed per current language in both locale
files) says exactly what the control is and what a tap does.

**Flat, not neumorphic.** The reference's heavy embossed/inset shadows fight the app's flat
cream-and-border language (0006); adopted are only its geometry and logic. The knob gets the
one soft shadow the theme already uses (ExitButton precedent); the track stays a flat bordered
pill.

## Alternatives considered

- **Keep the two tiles (0039)** — explicit and label-rich, but two large tiles occupy header
  space for a binary choice, and the round-5 shell moves the control to Settings where a
  compact single control reads better. The tiles' endonym labels ("Türkçe"/"English") are the
  real loss; accepted because the flag remains the pre-reader's cue.
- **Knob shows the TARGET language** — makes the tap outcome visible, but a pre-reader would
  see a foreign flag on "their" switch and read the state as wrong. Current + end labels keeps
  state truthful and the outcome spoken.
- **`accessibilityRole="switch"` + `state.checked`** — announces on/off; wrong model for two
  named states (which language would be "on"?).
- **`runOnJS` at spring midpoint for the flag swap** — bridges to JS for something a pure
  worklet interpolation does deterministically; loses frame-exactness under interruption.
- **Neumorphic styling per the reference** — visually faithful to the image but alien to every
  other surface in the app; the design language wins over the reference's finish.

## Consequences

- The header/Settings row gets a compact ~200dp-wide control instead of two 64dp tiles.
- The endonym language names disappear from the control; the spoken label and (T4) the
  Settings row context carry the names instead.
- The knob slide begins under the fading overlay on slow devices — verified acceptable on
  device; the ceremony's opaque phase still covers the actual language swap.
- Tests moved from radio-role semantics to button-role + state; the store/overlay tests are
  untouched (ceremony unchanged).

## References

- Reanimated interpolate/Extrapolation/withSpring/useReducedMotion:
  https://docs.swmansion.com/react-native-reanimated/
- RN accessibilityRole/State: https://reactnative.dev/docs/accessibility
- i18next getFixedT / changeLanguage: https://www.i18next.com/overview/api
