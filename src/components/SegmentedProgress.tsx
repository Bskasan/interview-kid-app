/**
 * Quiz progress header: one segment per question showing its OUTCOME — green
 * ✓ for correct, coral ✗ for wrong/timeout, a softly pulsing outline for the
 * current question, beige for upcoming — plus a "Soru 2/3" label. Meaning is
 * carried by the glyphs and the spoken per-question summary, never color alone.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { type QuestionOutcome } from '@/lib/quiz';
import { colors, radius, spacing, typography } from '@/theme';

// Language-neutral glyphs (AnswerTile badge pattern), not copy — no t() needed.
const CHECK_GLYPH = '✓';
const CROSS_GLYPH = '✗';

type Props = {
  /** 1-based index of the question on screen. */
  current: number;
  total: number;
  /** Outcome per answered question, in order (may include the current one). */
  outcomes: readonly QuestionOutcome[];
};

export function SegmentedProgress({ current, total, outcomes }: Props) {
  const { t } = useTranslation('exercise');
  const reduceMotion = useReducedMotion();

  // "You are here" breathes gently; a static outline under reduced motion.
  const pulse = useSharedValue(1);
  const hasOpenCurrent = outcomes.length < current && !reduceMotion;
  useEffect(() => {
    if (hasOpenCurrent) {
      pulse.value = withRepeat(
        withSequence(withTiming(0.55, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
      );
      return () => cancelAnimation(pulse);
    }
    pulse.value = 1;
    return undefined;
  }, [hasOpenCurrent, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const counter = t('question', { current, total });
  const spokenOutcomes = outcomes
    .map((outcome, index) => t(`outcome.${outcome}`, { number: index + 1 }))
    .join(', ');
  const label = spokenOutcomes.length > 0 ? `${counter}. ${spokenOutcomes}` : counter;

  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, index) => {
          const outcome = outcomes[index];
          if (outcome) {
            const isCorrect = outcome === 'correct';
            return (
              <View
                key={index}
                style={[
                  styles.segment,
                  { backgroundColor: isCorrect ? colors.primary : colors.coral },
                ]}
              >
                <View style={styles.glyphDisc}>
                  <Text style={styles.glyph} maxFontSizeMultiplier={1}>
                    {isCorrect ? CHECK_GLYPH : CROSS_GLYPH}
                  </Text>
                </View>
              </View>
            );
          }
          if (index === current - 1) {
            return (
              <Animated.View
                key={index}
                style={[styles.segment, styles.currentSegment, pulseStyle]}
              />
            );
          }
          return <View key={index} style={[styles.segment, styles.upcomingSegment]} />;
        })}
      </View>
      <Text style={styles.label} maxFontSizeMultiplier={1.4}>
        {counter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentSegment: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.sky,
  },
  upcomingSegment: {
    backgroundColor: colors.border,
  },
  // Ink glyph on a white disc: readable on both the green and coral fills
  // (coral is never a text-bearing surface).
  glyphDisc: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.ink,
  },
  label: {
    ...typography.caption,
    color: colors.ink,
  },
});
