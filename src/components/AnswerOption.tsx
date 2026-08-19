import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

/**
 * idle: awaiting the child's tap. After an answer locks in:
 * correct = the tapped right answer, wrongChoice = the tapped wrong answer,
 * revealCorrect = the right answer shown after a wrong tap or timeout,
 * lockedOut = the remaining options (dimmed, unpressable).
 */
export type AnswerFeedback = 'idle' | 'correct' | 'wrongChoice' | 'revealCorrect' | 'lockedOut';

// Feedback is never color-alone: ✓/✗ prefixes + border shapes carry the meaning.
const feedbackStyles = {
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  correct: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  wrongChoice: { backgroundColor: colors.surface, borderColor: colors.coral },
  revealCorrect: { backgroundColor: colors.surface, borderColor: colors.primary },
  lockedOut: { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.55 },
} as const;

const prefixes: Record<AnswerFeedback, string> = {
  idle: '',
  correct: '✓ ',
  wrongChoice: '✗ ',
  revealCorrect: '✓ ',
  lockedOut: '',
};

type Props = {
  label: string;
  feedback: AnswerFeedback;
  onPress: () => void;
};

export function AnswerOption({ label, feedback, onPress }: Props) {
  const locked = feedback !== 'idle';
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback({ disabled: locked });
  const reduceMotion = useReducedMotion();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (feedback === 'wrongChoice' && !reduceMotion) {
      // Gentle shake — a wobble, not a punishment.
      shakeX.value = withSequence(
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 40 })
      );
    }
  }, [feedback, reduceMotion, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Animated.View style={[animatedStyle, shakeStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={locked}
        accessibilityRole="button"
        accessibilityLabel={prefixes[feedback] + label}
        accessibilityState={{
          disabled: locked,
          selected: feedback === 'correct' || feedback === 'wrongChoice',
        }}
        style={({ pressed }) => [
          styles.base,
          feedbackStyles[feedback],
          pressed && !locked && styles.pressed,
        ]}
      >
        <Text style={styles.label} numberOfLines={2} maxFontSizeMultiplier={1.4}>
          {prefixes[feedback]}
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.primary,
    borderRadius: radius.button,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  label: {
    ...typography.bodyBold,
    color: colors.ink,
    textAlign: 'center',
  },
});
