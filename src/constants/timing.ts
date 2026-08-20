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
