import { lessonStars, mapNodeStates, UNLOCK_STARS_REQUIRED } from '../../src/lib/unlock';
import { PASS_RATIO } from '../../src/lib/scoring';

describe('lessonStars — best attempt as a star count', () => {
  it('is the best correct count, and 0 without a record', () => {
    expect(lessonStars({ best: 2, total: 3, badge: 'earned' })).toBe(2);
    expect(lessonStars(undefined)).toBe(0);
  });

  it('clamps corrupt records', () => {
    expect(lessonStars({ best: 99, total: 3, badge: 'perfect' })).toBe(3);
    expect(lessonStars({ best: -1, total: 3, badge: 'none' })).toBe(0);
    expect(lessonStars({ best: 3, total: 0, badge: 'none' })).toBe(0);
  });
});

describe('mapNodeStates — sequential star-gated unlocking', () => {
  it('shares the threshold with the pass rule (single source of truth)', () => {
    expect(UNLOCK_STARS_REQUIRED).toBe(PASS_RATIO.numerator);
  });

  it('starts with only the first lesson open', () => {
    expect(mapNodeStates([0, 0, 0])).toEqual(['current', 'locked', 'locked']);
  });

  it('unlocks the next lesson at exactly the pass grade', () => {
    expect(mapNodeStates([2, 0, 0])).toEqual(['completed', 'current', 'locked']);
    expect(mapNodeStates([3, 0, 0])).toEqual(['completed', 'current', 'locked']);
  });

  it('does not unlock on a failed attempt (1 star)', () => {
    expect(mapNodeStates([1, 0, 0])).toEqual(['current', 'locked', 'locked']);
  });

  it('chains through a completed run and marks the frontier current', () => {
    expect(mapNodeStates([3, 2, 1, 0])).toEqual(['completed', 'completed', 'current', 'locked']);
  });

  it('has no current node when everything is completed', () => {
    expect(mapNodeStates([2, 3, 2])).toEqual(['completed', 'completed', 'completed']);
  });

  it('handles an empty map', () => {
    expect(mapNodeStates([])).toEqual([]);
  });
});
