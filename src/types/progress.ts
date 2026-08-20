/**
 * Progress vocabulary shared by scoring, the progress store, the map's star
 * and unlock rules and the dashboard total: badge levels and the stored
 * best-attempt shape.
 */
export type Badge = 'none' | 'earned' | 'perfect';

/** Best completed attempt for one lesson. Only completed attempts are recorded. */
export type LessonResult = {
  /** Highest number of correct answers achieved so far. */
  best: number;
  /** Number of questions in the attempt that produced `best`. */
  total: number;
  /** Badge earned by the best attempt. */
  badge: Badge;
};
