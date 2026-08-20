/**
 * Quiz shape constants. Deliberately small: seconds-per-question is flow timing
 * (constants/timing.ts), the pass threshold stays as integer-ratio math beside
 * its tests in src/lib/scoring.ts, and options-per-question is enforced by the
 * Question tuple type in src/data/questions.ts.
 */

/** Questions per attempt; every question set has exactly this many. */
export const QUESTIONS_PER_ATTEMPT = 3;
