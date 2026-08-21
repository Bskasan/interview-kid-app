/**
 * 2×2 answer grid for the quiz stage: sizes tiles from the window via a pure,
 * unit-tested function so four tiles fit scroll-free with a 120dp touch floor,
 * and renders one AnswerTile per option.
 */
import { AnswerTile } from '@/components/AnswerTile';
import { type Question } from '@/data/questions';
import { type AnswerFeedback } from '@/lib/quiz';
import { spacing } from '@/theme';
import { computeTileSize } from '@/utils/computeTileSize';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

// Two explicit rows instead of flexWrap: the tuple guarantees exactly four
// options, and explicit rows can't mis-wrap when a rounding error adds a pixel.
const ROWS = [
  [0, 1],
  [2, 3],
] as const;

export type AnswerGridProps = {
  options: Question['options'];
  feedbackFor: (index: number) => AnswerFeedback;
  onSelect: (index: number) => void;
};

export function AnswerGrid({ options, feedbackFor, onSelect }: AnswerGridProps) {
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
