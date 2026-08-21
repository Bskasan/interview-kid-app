import { spacing } from '@/theme';

export const RESERVED_VERTICAL = 310;
export const MIN_TILE_HEIGHT = 120;

/**
 * Pure so the 2×2 sizing is unit-testable: width fills two columns; height is
 * square-ish but capped by what the screen has left, never below the touch floor
 * (below the floor only the tile's visual shrinks, in AnswerTile).
 */
export function computeTileSize(window: { width: number; height: number }): {
  width: number;
  height: number;
} {
  const contentWidth = window.width - spacing.lg * 2;
  const tileWidth = Math.floor((contentWidth - spacing.md) / 2);
  const gridBudget = window.height - RESERVED_VERTICAL;
  const tileHeight = Math.max(
    MIN_TILE_HEIGHT,
    Math.min(tileWidth, Math.floor((gridBudget - spacing.md) / 2)),
  );
  return { width: tileWidth, height: tileHeight };
}
