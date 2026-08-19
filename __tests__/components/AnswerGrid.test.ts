import { computeTileSize, MIN_TILE_HEIGHT } from '../../src/components/AnswerGrid';

describe('computeTileSize — 2×2 grid sizing from the window', () => {
  it('fills a 360×640 screen with square tiles and no scrolling', () => {
    expect(computeTileSize({ width: 360, height: 640 })).toEqual({ width: 158, height: 158 });
  });

  it('never squeezes tiles below the touch floor on short screens', () => {
    const tile = computeTileSize({ width: 360, height: 500 });
    expect(tile.height).toBe(MIN_TILE_HEIGHT);
    expect(tile.width).toBe(158);
  });

  it('caps tile height at the width so tall screens keep square-ish tiles', () => {
    const tile = computeTileSize({ width: 360, height: 900 });
    expect(tile.height).toBe(tile.width);
  });
});
