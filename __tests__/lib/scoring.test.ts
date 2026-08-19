import { computeOutcome, mergeResult } from '../../src/lib/scoring';
import type { LessonResult } from '../../src/types/progress';

describe('computeOutcome', () => {
  it.each([
    [3, 3, { passed: true, badge: 'perfect' }],
    [2, 3, { passed: true, badge: 'earned' }],
    [1, 3, { passed: false, badge: 'none' }],
    [0, 3, { passed: false, badge: 'none' }],
  ])('scores %i/%i as %o', (correct, total, expected) => {
    expect(computeOutcome(correct, total)).toEqual(expected);
  });

  it('clamps out-of-range and non-finite input', () => {
    expect(computeOutcome(99, 3)).toEqual({ passed: true, badge: 'perfect' });
    expect(computeOutcome(-5, 3)).toEqual({ passed: false, badge: 'none' });
    expect(computeOutcome(Number.NaN, 3)).toEqual({ passed: false, badge: 'none' });
  });

  it('treats a non-positive total as no result', () => {
    expect(computeOutcome(3, 0)).toEqual({ passed: false, badge: 'none' });
    expect(computeOutcome(3, -1)).toEqual({ passed: false, badge: 'none' });
  });
});

describe('mergeResult', () => {
  const earned: LessonResult = { best: 2, total: 3, badge: 'earned' };

  it('records a first attempt', () => {
    expect(mergeResult(undefined, 1, 3)).toEqual({ best: 1, total: 3, badge: 'none' });
  });

  it('upgrades when the new attempt is better', () => {
    expect(mergeResult(earned, 3, 3)).toEqual({ best: 3, total: 3, badge: 'perfect' });
  });

  it('keeps the previous result on a worse attempt', () => {
    expect(mergeResult(earned, 1, 3)).toBe(earned);
  });

  it('keeps the previous result on a tie', () => {
    expect(mergeResult(earned, 2, 3)).toBe(earned);
  });

  it('ignores attempts with a bogus total', () => {
    expect(mergeResult(earned, 3, 0)).toBe(earned);
  });
});
