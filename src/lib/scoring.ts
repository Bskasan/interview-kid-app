import type { Badge, LessonResult } from '@/types/progress';

export type Outcome = {
  passed: boolean;
  badge: Badge;
};

/**
 * Pass/badge rules: pass = at least 2/3 correct, perfect badge = all correct,
 * normal badge = passed.
 * Written as integer math (3*correct >= 2*total) to avoid float threshold bugs.
 * Inputs are clamped so garbage route params can never produce a bogus badge.
 */
export function computeOutcome(correct: number, total: number): Outcome {
  if (!Number.isFinite(total) || total <= 0) {
    return { passed: false, badge: 'none' };
  }
  const safeCorrect = clamp(correct, 0, total);
  const passed = 3 * safeCorrect >= 2 * total;
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
  total: number
): LessonResult {
  if (!Number.isFinite(total) || total <= 0) {
    return previous ?? { best: 0, total: 0, badge: 'none' };
  }
  const safeCorrect = clamp(correct, 0, total);
  if (previous && previous.best >= safeCorrect) {
    return previous;
  }
  return { best: safeCorrect, total, badge: computeOutcome(safeCorrect, total).badge };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.trunc(value), min), max);
}
