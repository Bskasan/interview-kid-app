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
