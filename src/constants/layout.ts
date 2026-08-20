/**
 * Cross-cutting touch-target minimums from the design language ("big
 * everything", small imprecise hands). Component-specific sizes stay with their
 * components; visual design tokens (colors, radius, spacing, type) stay in src/theme.
 */

/** Minimum interactive sizes (dp): primary CTAs vs compact secondary controls. */
export const TOUCH_TARGET = {
  primary: 56,
  compact: 48,
} as const;
