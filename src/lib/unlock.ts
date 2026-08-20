/**
 * Pure unlocking rules for the lesson map: stars are the best attempt's
 * correct count, and each lesson opens only after the previous one reaches
 * the pass-grade star count. Single source of truth: the threshold IS the
 * pass rule's numerator.
 */
import { PASS_RATIO } from '@/lib/scoring';
import { clamp } from '@/utils/clamp';
import type { LessonResult } from '@/types/progress';

/** Stars needed on lesson N to unlock lesson N+1 — the pass grade (2). */
export const UNLOCK_STARS_REQUIRED = PASS_RATIO.numerator;

export type MapNodeState = 'locked' | 'unlocked' | 'current' | 'completed';

/** Stars for one lesson: best correct answers, clamped; no record = 0. */
export function lessonStars(result: LessonResult | undefined): number {
  if (!result || !Number.isFinite(result.total) || result.total <= 0) {
    return 0;
  }
  return clamp(Math.trunc(result.best), 0, result.total);
}

/**
 * Projects the ordered star counts onto node states. Node 0 is always
 * unlocked; node N unlocks when node N−1 has the pass-grade stars;
 * `current` is the first unlocked, not-yet-passed node (the chain rule makes
 * it unique); passed nodes are `completed`. All passed → no current node.
 */
export function mapNodeStates(starsInOrder: readonly number[]): MapNodeState[] {
  let currentAssigned = false;
  return starsInOrder.map((stars, index) => {
    const unlocked = index === 0 || (starsInOrder[index - 1] ?? 0) >= UNLOCK_STARS_REQUIRED;
    if (!unlocked) {
      return 'locked';
    }
    if (stars >= UNLOCK_STARS_REQUIRED) {
      return 'completed';
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return 'current';
    }
    return 'unlocked';
  });
}
