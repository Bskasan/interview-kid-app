/**
 * Motion tokens. Springy but short (200–400 ms perceived), per the design language.
 * Anything using these must check `useReducedMotion()` (reanimated) and fall back to
 * instant/static states.
 */
export const motion = {
  /** withSpring config for appear/press animations — bouncy but settles fast. */
  spring: { damping: 14, stiffness: 220 },
  /** withSpring config for celebration pops (badge reveal) — a bit more drama. */
  springSoft: { damping: 12, stiffness: 140 },
  /** withTiming durations (ms) for color/opacity shifts. */
  duration: {
    fast: 200,
    base: 250,
    slow: 300,
  },
  /** Scale applied to pressed chunky controls. */
  pressScale: 0.97,
} as const;
