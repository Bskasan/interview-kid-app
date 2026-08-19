import * as Haptics from 'expo-haptics';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '@/theme';

/**
 * Shared press physics for every tappable element (design principle: each tap gives
 * color + scale bounce + haptic). Spread the returned handlers onto a Pressable and
 * put `animatedStyle` on an Animated.View around it. Respects reduced motion
 * (no bounce); haptics are best-effort.
 */
export function usePressFeedback({ disabled = false }: { disabled?: boolean } = {}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    if (disabled) {
      return;
    }
    if (!reduceMotion) {
      scale.value = withSpring(motion.pressScale, motion.spring);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const onPressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, motion.spring);
    }
  };

  return { animatedStyle, onPressIn, onPressOut };
}
