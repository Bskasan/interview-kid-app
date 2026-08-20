/**
 * Result-screen star reveal: one slot per question, earned stars pop in one
 * by one with a spring; unearned slots stay hollow. Static under reduced
 * motion. The row speaks its count as one sentence.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { colors } from '@/theme';
import { clamp } from '@/utils/clamp';

const STAR_SIZE = 40;
const FIRST_STAR_DELAY_MS = 250;
const STAR_STAGGER_MS = 350;

// Language-neutral glyphs (AnswerTile badge pattern), not copy — no t() needed.
const EARNED_GLYPH = '⭐';
const HOLLOW_GLYPH = '☆';

type Props = {
  earned: number;
  total: number;
};

export function StarReveal({ earned, total }: Props) {
  const { t } = useTranslation('result');
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeEarned = clamp(Math.trunc(earned), 0, safeTotal);

  return (
    <View style={styles.row} accessible accessibilityLabel={t('starsA11y', { count: safeEarned })}>
      {Array.from({ length: safeTotal }, (_, index) =>
        index < safeEarned ? (
          <Animated.Text
            key={index}
            entering={ZoomIn.delay(FIRST_STAR_DELAY_MS + index * STAR_STAGGER_MS)
              .springify()
              .damping(12)
              .reduceMotion(ReduceMotion.System)}
            style={styles.star}
            maxFontSizeMultiplier={1}
          >
            {EARNED_GLYPH}
          </Animated.Text>
        ) : (
          <Text key={index} style={[styles.star, styles.hollow]} maxFontSizeMultiplier={1}>
            {HOLLOW_GLYPH}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: STAR_SIZE,
    lineHeight: STAR_SIZE + 8,
  },
  hollow: {
    color: colors.muted,
  },
});
