/**
 * Clamps `value` into [min, max]; a non-finite value (NaN/±Infinity) collapses
 * to `min` so garbage input degrades to the safe floor instead of propagating.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}
