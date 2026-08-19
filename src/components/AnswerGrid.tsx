import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AnswerTile } from '@/components/AnswerTile';
import { type Question } from '@/data/questions';
import { type AnswerFeedback } from '@/lib/quiz';
import { spacing } from '@/theme';

/** Tiles never get shorter than this — small hands need a big target. */
export const MIN_TILE_HEIGHT = 120;

// Vertical space the quiz screen spends outside the grid, from the measured
// styles: screen padding 32 + four column gaps 64 + top row (48dp exit button
// with the progress bar beside it) + timer ~30 + one-line prompt with margins
// ~54 + mascot row 48 ≈ 276, padded to absorb the status-bar inset. Keeps a
// 360×640 screen scroll-free.
const RESERVED_VERTICAL = 292;

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

type Props = {
  options: Question['options'];
  feedbackFor: (index: number) => AnswerFeedback;
  onSelect: (index: number) => void;
};

// Two explicit rows instead of flexWrap: the tuple guarantees exactly four
// options, and explicit rows can't mis-wrap when a rounding error adds a pixel.
const ROWS = [
  [0, 1],
  [2, 3],
] as const;

export function AnswerGrid({ options, feedbackFor, onSelect }: Props) {
  const dimensions = useWindowDimensions();
  const tile = computeTileSize(dimensions);

  return (
    <View style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((index) => (
            <AnswerTile
              key={index}
              option={options[index]}
              feedback={feedbackFor(index)}
              onPress={() => onSelect(index)}
              width={tile.width}
              height={tile.height}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
