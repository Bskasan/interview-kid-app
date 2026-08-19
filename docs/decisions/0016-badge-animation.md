# 0016 — Badge celebration hand-rolled with Reanimated

Status: accepted
Date: 2026-08-19

## Context

The brief requires the earned badge to appear with "some kind of animation/motion" and leaves
the library choice open. The design language wants a real celebration moment (spring pop +
confetti) but the repo bans third-party visual IP, and every dependency must be Expo Go-safe
and defensible in review.

## Decision

`BadgeReveal` is built only with **react-native-reanimated** (already in the stack): the badge
circle springs in from scale 0 with a slight tilt settling to 0°, a one-shot glow ring expands
and fades behind it, and ~10 small colored rectangles fall and rotate as confetti with staggered
delays. Confetti positions/rotations derive from the piece index (deterministic pseudo-random),
so bursts are reproducible. `useReducedMotion` renders the badge statically with no confetti or
glow.

## Alternatives considered

- **Lottie (lottie-react-native)** — beautiful results, works in Expo Go, but needs a sourced
  .json animation (licensing/IP diligence for a take-home), adds a dependency, and hides the
  motion logic in an opaque asset — indefensible in a "why every choice" interview.
- **react-native-confetti-cannon (or similar)** — a dependency for ~40 lines of transform
  animation; less control over reduced-motion behavior and colors.
- **RN Animated (core) instead of Reanimated** — possible, but Reanimated is already installed,
  runs on the UI thread, and provides `useReducedMotion`; mixing two animation systems in one
  codebase costs consistency for nothing.

## Consequences

- Zero new dependencies; the whole celebration is ~150 readable lines and uses theme tokens.
- Deterministic confetti simplifies eyeballing regressions; no `Math.random` in render.
- A designer-grade particle system (physics, easing variety) is out of scope; at production
  scale Lottie with owned assets would likely replace this.

## References

- Reanimated (withSpring/withTiming/withDelay, useReducedMotion): https://docs.swmansion.com/react-native-reanimated/
