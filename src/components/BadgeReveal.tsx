import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { strings } from '@/lib/strings';
import { colors, motion, spacing } from '@/theme';
import type { Badge } from '@/types/progress';

const BADGE_SIZE = 148;
const CONFETTI_COUNT = 10;
const CONFETTI_COLORS = [colors.primary, colors.sky, colors.sun, colors.coral, colors.grape];

const badgeLook: Record<Exclude<Badge, 'none'>, { emoji: string; ring: string }> = {
  earned: { emoji: '🏅', ring: colors.sun },
  perfect: { emoji: '🌟', ring: colors.grape },
};

type Props = {
  badge: Exclude<Badge, 'none'>;
};

/**
 * Celebration badge: pops in with a spring (scale + settle from a tilt), emits a
 * one-shot glow ring and a few confetti pieces — all hand-rolled with Reanimated
 * (ADR 0016). Reduced motion renders everything static, no confetti.
 */
export function BadgeReveal({ badge }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0);
  const rotate = useSharedValue(reduceMotion ? 0 : -15);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(reduceMotion ? 0 : 0.5);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    scale.value = withSpring(1, motion.springSoft);
    rotate.value = withSpring(0, motion.springSoft);
    glowScale.value = withDelay(200, withTiming(1.7, { duration: 500 }));
    glowOpacity.value = withDelay(200, withTiming(0, { duration: 500 }));
  }, [reduceMotion, scale, rotate, glowScale, glowOpacity]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const { emoji, ring } = badgeLook[badge];

  return (
    <View
      style={styles.stage}
      accessible
      accessibilityLabel={strings.a11y.lessonStatus[badge]}
    >
      {reduceMotion
        ? null
        : Array.from({ length: CONFETTI_COUNT }, (_, index) => (
            <ConfettiPiece key={index} index={index} />
          ))}
      <Animated.View style={[styles.glow, { backgroundColor: ring }, glowStyle]} />
      <Animated.View style={[styles.badge, { borderColor: ring }, badgeStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * One confetti rectangle. Index-derived pseudo-randomness keeps the burst
 * deterministic (stable screenshots, no Math.random in render).
 */
function ConfettiPiece({ index }: { index: number }) {
  const jitter = (index * 37) % 13;
  const direction = index % 2 === 0 ? 1 : -1;
  const startDelay = 150 + index * 45;
  const horizontal = direction * (30 + ((index * 53) % 70));
  const fallDistance = 130 + jitter * 9;

  const translateY = useSharedValue(-10);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(startDelay, withTiming(1, { duration: 80 }));
    translateY.value = withDelay(startDelay, withTiming(fallDistance, { duration: 900 }));
    translateX.value = withDelay(startDelay, withTiming(horizontal, { duration: 900 }));
    rotate.value = withDelay(startDelay, withTiming(180 + jitter * 40, { duration: 900 }));
    opacity.value = withDelay(startDelay + 650, withTiming(0, { duration: 350 }));
  }, [startDelay, fallDistance, horizontal, jitter, translateY, translateX, rotate, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        { backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  stage: {
    width: BADGE_SIZE * 2,
    height: BADGE_SIZE + spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 16,
    borderRadius: 3,
  },
});
