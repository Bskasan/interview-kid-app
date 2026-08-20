# 0051 — Layout invariants for inline controls, and how we verify them

Status: accepted (amends 0020's test strategy and 0050's button spec)
Date: 2026-08-20

## Context

The read-aloud button shipped in 0050 was **invisible on device**. Root cause: `Mascot`'s
`readAloud` path nested the accessible figure (circle + bubble) and the fixed-size button in a
new row, but the figure had no `flexShrink` and React Native's Yoga default is `0`. With no
shrinkable child, negative free space is never distributed: the figure kept its full hypothetical
width and the button was laid out past the row's right edge. Two aggravating details made it
invisible rather than merely ugly — React Native does not clip by default (so there was no
clipped stub to notice), and Android does not dispatch touches to a child outside its ancestor's
bounds (so the partially-visible cases on other screens were dead targets too).

The `flexShrink: 1` that _was_ written sat on the wrapper row, whose parents are columns — where
`flexShrink` governs **height**. It was a no-op on the axis that mattered. The same class of bug
was then found on four more screens, plus the tab bar, the settings row and the map's star slot.

Crucially, **every test passed**. `jest-expo` renders through `react-test-renderer`, which never
runs Yoga: there is no layout pass, no measurement, no viewport. `getByLabelText(t('speakA11y'))`
succeeds on a screen where the button is 100dp off the right edge. Presence assertions are
structurally blind to this bug class.

## Decision

**1. The invariant.** Any row that pairs flexible content with a fixed-size control must satisfy
both halves, or the control is pushed out:

- the row has a **definite width** — it is a direct child of a stretching parent, or it sets
  `alignSelf: 'stretch'`, or it is given an explicit width. Under the at-most constraint that
  centering parents (`alignItems: 'center'`) impose, a shrink factor may never engage.
- exactly one child **can** yield: the flexible one carries `flexShrink: 1` (or `flex: 1` when it
  should also fill), and the fixed control carries `flexShrink: 0`.

The two rows that already worked are the reference: `LessonBubble.headerRow` (thumbnail 52 +
`flex: 1` title block + button) and the exercise `promptRow` (`flexShrink: 1` prompt + button).
`Mascot` now matches, with the shrink applied **only on the read-aloud path** — on the plain path
the parent is a column, where the same property would silently shrink the mascot vertically.

**2. Fixed-size controls are sized from the repo's own floor.** `SpeakButton` was 44dp (the iOS
HIG minimum) while CLAUDE.md mandates 48dp absolute minimum and `TOUCH_TARGET.compact = 48`
already existed for exactly this. It now uses the constant.

**3. Text that shares a row with a control must be capped.** Every `Text` in such a row gets a
`maxFontSizeMultiplier` (1.4 for copy, 1 for emoji that live inside fixed-size circles/tiles).
Emoji at 2× system scale burst their container; a hard `numberOfLines` without a cap silently
ellipsizes the sentence instead. The mascot's speech line is capped but deliberately keeps **no**
`numberOfLines` — a taller bubble is always better than a truncated instruction for a pre-reader.

**4. Verification moves to where a layout engine exists.** Since jest cannot catch this, the
guard is explicit instead of implicit:

- the Expo **web preview at a 360dp-wide viewport**, measuring the control's bounding rect and
  asserting it lies inside the viewport — the check that would have caught the original bug in
  seconds;
- a narrow-screen + large-font line in each affected feature doc's manual test steps.

We deliberately do **not** add style-shape assertions (e.g. "the figure has `flexShrink: 1`"):
they assert the fix rather than the behavior, they are the snapshot-style brittleness 0020
rejected, and they would still pass if a parent later removed the definite width.

## Alternatives considered

- **`flex: 1` on the mascot figure** (the `LessonBubble` pattern) — also engages under at-most
  constraints, but `flexBasis: 0` + grow makes the figure fill the row even for a short line,
  leaving the bubble hugging its text with the button floating far away. Right for a fixed-width
  card, wrong for a centered hero.
- **Put the button inside the speech bubble** — narrower, but the bubble is inside the single
  `accessible` image node, so TalkBack would swallow the control (the reason 0050 put it outside).
- **A layout-capable test harness** (jsdom + a Yoga build, or Detox/Maestro on an emulator) —
  the only way to make this catchable in CI. Real, but a disproportionate lift for a take-home;
  recorded in README as the E2E gap instead.
- **Leave the button at 44dp** — passes iOS guidance, contradicts our own written floor. Consistency
  with the stated rule wins; 48dp costs nothing.

## Consequences

- One shared, documented rule now covers the mascot rows, the prompt row, the map bubble, the
  settings row and any future inline control.
- The read-aloud target grew 44→48dp everywhere; `AnswerGrid`'s `RESERVED_VERTICAL` was corrected
  from 292 to 310 to match the taller prompt row it had never accounted for (tile sizes on a
  360×640 screen are unchanged, so the pinned sizing test still holds).
- Layout regressions remain **not** covered by CI. That is now a written trade-off with a named
  manual procedure, not an accident.
- Large-font behavior is hardened to ~1.4×; beyond that the fixed-height screens have nowhere to
  put the overflow (they do not scroll) — recorded in README.

## References

- Yoga / flexbox in React Native (`flexShrink` defaults to 0): https://reactnative.dev/docs/flexbox
- Text `maxFontSizeMultiplier` / `allowFontScaling`: https://reactnative.dev/docs/text
- Bottom-tab options (`tabBarAllowFontScaling`): https://reactnavigation.org/docs/bottom-tab-navigator/
- React Native Testing Library queries: https://callstack.github.io/react-native-testing-library/docs/api/queries
