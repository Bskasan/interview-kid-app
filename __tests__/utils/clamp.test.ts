import { clamp } from '../../src/utils/clamp';

describe('clamp', () => {
  it('keeps in-range values and cuts at both bounds', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-2, 0, 1)).toBe(0);
    expect(clamp(7, 0, 3)).toBe(3);
  });

  it('does not truncate floats (the timer bar depends on this)', () => {
    expect(clamp(0.33, 0, 1)).toBe(0.33);
  });

  it('collapses non-finite input to the floor', () => {
    expect(clamp(Number.NaN, 0, 3)).toBe(0);
    expect(clamp(Number.POSITIVE_INFINITY, 0, 3)).toBe(0);
    expect(clamp(Number.NEGATIVE_INFINITY, 0, 3)).toBe(0);
  });
});
