import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme';
import { LESSON_CARD_HEIGHT } from './LessonCard';

/** Placeholder card shown while the lesson list loads. Pulses unless reduced motion. */
export function LessonCardSkeleton() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) {
      opacity.value = withRepeat(withTiming(0.45, { duration: 600 }), -1, true);
    }
  }, [reduceMotion, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, pulseStyle]}>
      <View style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.lineWide} />
        <View style={styles.lineNarrow} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: LESSON_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.button,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  lineWide: {
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  lineNarrow: {
    height: 18,
    width: '50%',
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
});
