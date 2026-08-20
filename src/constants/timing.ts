/**
 * Flow timing constants: how long the app waits, counts down, or lingers before
 * it acts. Perceptual animation speeds live in src/theme/motion.ts; one-off
 * choreography numbers (shake offsets, confetti delays) stay with their component.
 */

/** Countdown budget per quiz question (design decision: 15 s). */
export const SECONDS_PER_QUESTION = 15;

/** How long the ✓/✗ answer feedback stays on screen before auto-advancing. */
export const ANSWER_FEEDBACK_MS = 1400;

/**
 * A video that is neither playable nor errored after this long counts as
 * failed: a silent stall must not leave the child staring at a spinner with a
 * locked CTA. 12 s rides out a slow cell handshake for a ~1 MB clip without
 * feeling infinite to a 5-year-old.
 */
export const VIDEO_READY_TIMEOUT_MS = 12_000;

/** Abort budget for the Home lessons request. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Countdown display refresh interval; timing itself is timestamp-based. */
export const COUNTDOWN_TICK_MS = 100;

/**
 * Language-change overlay choreography (all measured from the tap). The swap
 * fires 50 ms after the fade-in completes so JS-timer drift can never expose a
 * half-translated frame; the hold keeps the overlay fully opaque through the
 * re-render. Total stays within the 700–900 ms "springy but calm" budget.
 */
export const LANGUAGE_TRANSITION = {
  /** Overlay opacity 0 → 1. */
  fadeInMs: 250,
  /** i18next changeLanguage fires under full opacity. */
  swapAtMs: 300,
  /** Opacity 1 → 0 starts here (300 ms fully-opaque hold). */
  fadeOutAtMs: 600,
  /** Overlay unmounts; interaction unblocks. */
  totalMs: 850,
} as const;
