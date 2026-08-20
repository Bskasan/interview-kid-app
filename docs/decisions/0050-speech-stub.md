# 0050 — Read-aloud affordance now, TTS later (speech stub)

Status: accepted
Date: 2026-08-20

## Context

The target users are pre-readers, and the README has carried "audio narration is the honest
fix" as a would-do-next item since round 3. Round 5 ships the UI half by explicit product
decision: a visible read-aloud button beside every sentence a child must understand alone,
while actual audio stays out of scope. Constraints: no new dependency (expo-speech is NOT
installed), no fake audio, and screen-reader users must not get every sentence twice.

## Decision

**Interface-first stub.** `src/lib/speech.ts` exports `speak(text: string, language:
AppLanguage)` as a no-op whose signature is byte-compatible with expo-speech's
`Speech.speak(text, { language })` — the one-line path to real TTS is
`npx expo install expo-speech` plus one function body. Callers pass the **already-translated
string** (not a key): it mirrors the real API exactly and keeps the speech module free of any
i18n dependency.

**Honest affordance.** `SpeakButton` (round, surface + soft shadow, 🔊) gives real
feedback for what really happens — press bounce + haptic (shared `usePressFeedback`) and a
short sound-wave wiggle on the icon (reduced motion skips it). No fake beeps, no pretend
progress. _(Shipped at 44dp; corrected to `TOUCH_TARGET.compact` = 48dp by 0051, which also
fixes the row layout this button must sit in — as first shipped it was pushed off-screen on
every mascot placement.)_

**Placement rule: next to text a child must understand on their own.** Most such lines are
mascot speech, so `Mascot` gains an opt-in `readAloud` prop that renders the button as a
sibling of the mascot's single accessible image node (inside it, TalkBack would swallow the
button). Placed: welcome intro, dashboard greeting, map bubble titles, question prompts,
result mascot message, exit-sheet question, video-unavailable message. Deliberately NOT
placed: quiz feedback cheers and the video-stage status lines (transient reactions, not
comprehension-critical), settings rows and the version line (parent-facing), tab labels,
footer loading, star/streak counters (icon+number already), the welcome app name (decorative),
error banner (paired adult-facing surface).

**A11y nuance.** For TalkBack users the button is redundant — the adjacent text is already
read — so its label is just "Sesli oku"/"Read aloud" (never the sentence, which would
double-announce everything). It stays focusable: a sighted child using switch access or a
parent may still want it.

## Alternatives considered

- **Install expo-speech now** — real audio, but explicitly out of the round's scope, and
  quality work (voice choice per language, rate for children, interrupt/queue behavior) is a
  feature of its own; shipping robot audio half-tuned is worse than shipping none.
- **No button until TTS exists** — loses the layout/UX validation this round wants; adding
  the affordance later would re-open every screen.
- **Key-based API (`speak(key, locale)`)** — would let the stub resolve translations itself,
  but couples speech to i18n, diverges from the real expo-speech signature, and callers
  already hold the resolved string.
- **Hide from screen readers (`importantForAccessibility="no"`)** — avoids redundancy but
  removes the control from switch-access users; a short label costs one swipe stop.

## Consequences

- The visual language for read-aloud is settled and translated before audio exists; TTS lands
  without UI churn.
- Until then the button audibly does nothing — mitigated by honest motion feedback and a
  README "not production-ready" note.
- One more shared component; `Mascot` carries an extra optional prop.

## References

- expo-speech (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/speech/
- Reanimated (withSequence, useReducedMotion): https://docs.swmansion.com/react-native-reanimated/
- RN accessibility: https://reactnative.dev/docs/accessibility
