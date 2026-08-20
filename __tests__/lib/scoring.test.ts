import { computeOutcome, mergeResult, totalStars } from '../../src/lib/scoring';
import type { LessonResult } from '../../src/types/progress';

describe('computeOutcome — pass threshold and badge rules', () => {
  it.each([
    [3, 3, { passed: true, badge: 'perfect' }],
    [2, 3, { passed: true, badge: 'earned' }],
    [1, 3, { passed: false, badge: 'none' }],
    [0, 3, { passed: false, badge: 'none' }],
  ])('grades %i/%i correct as %o', (correct, total, expected) => {
    expect(computeOutcome(correct, total)).toEqual(expected);
  });

  it('clamps out-of-range and non-finite correct counts into valid grades', () => {
    expect(computeOutcome(99, 3)).toEqual({ passed: true, badge: 'perfect' });
    expect(computeOutcome(-5, 3)).toEqual({ passed: false, badge: 'none' });
    expect(computeOutcome(Number.NaN, 3)).toEqual({ passed: false, badge: 'none' });
  });

  it('treats a zero or negative question total as a failed empty outcome', () => {
    expect(computeOutcome(3, 0)).toEqual({ passed: false, badge: 'none' });
    expect(computeOutcome(3, -1)).toEqual({ passed: false, badge: 'none' });
  });
});

describe('mergeResult — best-attempt policy for retakes', () => {
  const earned: LessonResult = { best: 2, total: 3, badge: 'earned' };

  it('stores the first completed attempt as the best result', () => {
    expect(mergeResult(undefined, 1, 3)).toEqual({ best: 1, total: 3, badge: 'none' });
  });

  it('replaces the stored result when a retake scores higher', () => {
    expect(mergeResult(earned, 3, 3)).toEqual({ best: 3, total: 3, badge: 'perfect' });
  });

  it('keeps the stored result when a retake scores lower', () => {
    expect(mergeResult(earned, 1, 3)).toBe(earned);
  });

  it('keeps the stored result when a retake only ties it', () => {
    expect(mergeResult(earned, 2, 3)).toBe(earned);
  });

  it('ignores attempts reporting a zero or negative question total', () => {
    expect(mergeResult(earned, 3, 0)).toBe(earned);
  });

  // Pins the fallback for a first-ever attempt with an invalid total: a neutral
  // empty record, never a crash or a badge from garbage input.
  it('falls back to a neutral empty record when there is no previous result', () => {
    expect(mergeResult(undefined, 3, 0)).toEqual({ best: 0, total: 0, badge: 'none' });
  });
});

describe('totalStars — dashboard sum of best attempts', () => {
  it('sums best correct answers across lessons', () => {
    expect(
      totalStars({
        a: { best: 3, total: 3, badge: 'perfect' },
        b: { best: 2, total: 3, badge: 'earned' },
        c: { best: 1, total: 3, badge: 'none' },
      }),
    ).toBe(6);
  });

  it('is zero with no recorded lessons', () => {
    expect(totalStars({})).toBe(0);
  });

  it('clamps corrupt records instead of inflating or crashing the sum', () => {
    expect(
      totalStars({
        inflated: { best: 99, total: 3, badge: 'perfect' },
        negative: { best: -4, total: 3, badge: 'none' },
        emptyTotal: { best: 3, total: 0, badge: 'none' },
        fractional: { best: 1.9, total: 3, badge: 'none' },
      }),
    ).toBe(4); // 3 + 0 + 0 + 1
  });
});
