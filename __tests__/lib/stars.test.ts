import { EARNED_STAR, HOLLOW_STAR, starCounts } from '../../src/lib/stars';

describe('stars — shared star-display vocabulary', () => {
  it('passes valid counts through untouched', () => {
    expect(starCounts(2, 3)).toEqual({ earned: 2, total: 3 });
    expect(starCounts(0, 3)).toEqual({ earned: 0, total: 3 });
    expect(starCounts(3, 3)).toEqual({ earned: 3, total: 3 });
  });

  it('truncates fractional input to whole stars', () => {
    expect(starCounts(1.9, 3.7)).toEqual({ earned: 1, total: 3 });
  });

  it('clamps earned into [0, total]', () => {
    expect(starCounts(-2, 3)).toEqual({ earned: 0, total: 3 });
    expect(starCounts(7, 3)).toEqual({ earned: 3, total: 3 });
  });

  it('collapses garbage to the safe floor', () => {
    expect(starCounts(Number.NaN, 3)).toEqual({ earned: 0, total: 3 });
    expect(starCounts(2, -1)).toEqual({ earned: 0, total: 0 });
    expect(starCounts(2, Number.NaN)).toEqual({ earned: 0, total: 0 });
  });

  it('renders earned and hollow with distinct glyphs', () => {
    expect(EARNED_STAR).not.toBe(HOLLOW_STAR);
  });
});
