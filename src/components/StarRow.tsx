/**
 * Star row: one ⭐ per earned star, ☆ for the rest (ADR 0010 semantics —
 * shape carries the meaning, a child can count stars). Decorative by default:
 * parents fold the count into their own accessibility label.
 */
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';
import { clamp } from '@/utils/clamp';

type Props = {
  earned: number;
  total: number;
  size?: number;
};

export function StarRow({ earned, total, size = 18 }: Props) {
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeEarned = clamp(Math.trunc(earned), 0, safeTotal);
  return (
    <Text style={[styles.stars, { fontSize: size }]} accessible={false} maxFontSizeMultiplier={1.2}>
      {'⭐'.repeat(safeEarned) + '☆'.repeat(safeTotal - safeEarned)}
    </Text>
  );
}

const styles = StyleSheet.create({
  stars: {
    letterSpacing: 2,
    color: colors.muted,
  },
});
