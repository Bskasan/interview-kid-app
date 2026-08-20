/**
 * Star row: one ⭐ per earned star, ☆ for the rest — shape carries the
 * meaning, a child can count stars. Decorative by default: parents fold the
 * count into their own accessibility label.
 */
import { StyleSheet, Text } from 'react-native';
import { EARNED_STAR, HOLLOW_STAR, starCounts } from '@/lib/stars';
import { colors } from '@/theme';

type Props = {
  earned: number;
  total: number;
  size?: number;
};

export function StarRow({ earned, total, size = 18 }: Props) {
  const safe = starCounts(earned, total);
  return (
    <Text style={[styles.stars, { fontSize: size }]} accessible={false} maxFontSizeMultiplier={1.2}>
      {EARNED_STAR.repeat(safe.earned) + HOLLOW_STAR.repeat(safe.total - safe.earned)}
    </Text>
  );
}

const styles = StyleSheet.create({
  stars: {
    letterSpacing: 2,
    color: colors.muted,
  },
});
