import { clamp } from '@/utils/clamp';
import type { Badge, LessonResult } from '@/types/progress';

export type Outcome = {
  passed: boolean;
  badge: Badge;
};

/**
 * Pass rule: at least `numerator` of every `denominator` answers correct (2/3).
 * Kept beside the scoring logic as a ratio, not a flat count, so the rule holds
 * for any total; written as integer math to avoid float threshold bugs.
 */
export const PASS_RATIO = { numerator: 2, denominator: 3 } as const;

/**
 * Pass/badge rules: pass per PASS_RATIO, perfect badge = all correct,
 * normal badge = passed.
 * Inputs are clamped so garbage route params can never produce a bogus badge.
 */
export function computeOutcome(correct: number, total: number): Outcome {
  if (!Number.isFinite(total) || total <= 0) {
    return { passed: false, badge: 'none' };
  }
  const safeCorrect = clamp(Math.trunc(correct), 0, total);
  const passed = PASS_RATIO.denominator * safeCorrect >= PASS_RATIO.numerator * total;
  const badge: Badge = safeCorrect === total ? 'perfect' : passed ? 'earned' : 'none';
  return { passed, badge };
}

/**
 * Best-result policy for retakes: a new completed attempt replaces
 * the stored one only when it is strictly better (more correct answers). Ties keep
 * the existing record.
 */
export function mergeResult(
  previous: LessonResult | undefined,
  correct: number,
  total: number,
): LessonResult {
  if (!Number.isFinite(total) || total <= 0) {
    return previous ?? { best: 0, total: 0, badge: 'none' };
  }
  const safeCorrect = clamp(Math.trunc(correct), 0, total);
  if (previous && previous.best >= safeCorrect) {
    return previous;
  }
  return { best: safeCorrect, total, badge: computeOutcome(safeCorrect, total).badge };
}
