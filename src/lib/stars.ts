/**
 * Shared star-display vocabulary: the earned/hollow glyphs and the input
 * sanitizing both star renderers (row and reveal) must agree on.
 */
import { clamp } from '@/utils/clamp';

// Language-neutral glyphs (AnswerTile badge pattern), not copy — no t() needed.
export const EARNED_STAR = '⭐';
export const HOLLOW_STAR = '☆';

/** Raw earned/total sanitized into safe render counts: ints, 0 ≤ earned ≤ total. */
export function starCounts(earned: number, total: number): { earned: number; total: number } {
  // Math.max(0, NaN) is NaN, so a non-finite total needs its own guard.
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
  return { earned: clamp(Math.trunc(earned), 0, safeTotal), total: safeTotal };
}
