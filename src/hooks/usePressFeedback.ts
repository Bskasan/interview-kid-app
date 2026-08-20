/**
 * Shared press physics for every tappable element (design principle: each tap
 * gives color + scale bounce + haptic). Spread the returned handlers onto a
 * Pressable and put `animatedStyle` on an Animated.View around it. Respects
 * reduced motion (no bounce); haptics are best-effort.
 */
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { hapticImpactLight } from '@/lib/haptics';
import { motion } from '@/theme';

export function usePressFeedback({ disabled = false }: { disabled?: boolean } = {}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    if (disabled) {
      return;
    }
    if (!reduceMotion) {
      // eslint-disable-next-line react-hooks/immutability -- writing .value is Reanimated's shared-value API
      scale.value = withSpring(motion.pressScale, motion.spring);
    }
    hapticImpactLight();
  };

  const onPressOut = () => {
    if (!reduceMotion) {
      // eslint-disable-next-line react-hooks/immutability -- writing .value is Reanimated's shared-value API
      scale.value = withSpring(1, motion.spring);
    }
  };

  return { animatedStyle, onPressIn, onPressOut };
}
