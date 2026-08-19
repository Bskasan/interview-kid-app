import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, motion, radius, spacing, touchTarget, typography } from '@/theme';

/** Height of the darker "3D" bottom edge that collapses while pressed. */
const EDGE_HEIGHT = 4;

const variants = {
  primary: { fill: colors.primary, edge: colors.primaryDark },
  sky: { fill: colors.sky, edge: colors.skyDark },
  sun: { fill: colors.sun, edge: colors.sunDark },
  // No `coral` variant on purpose: no text color passes 4.5:1 on coral (see ADR 0006).
} as const;

export type ChunkyButtonVariant = keyof typeof variants;

type Props = {
  label: string;
  onPress: () => void;
  variant?: ChunkyButtonVariant;
  disabled?: boolean;
  /** Optional emoji rendered before the label — labels should rarely stand alone. */
  icon?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function ChunkyButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { fill, edge } = disabled ? { fill: colors.border, edge: colors.muted } : variants[variant];

  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(motion.pressScale, motion.spring);
    }
    // Haptics are best-effort: unavailable on some devices/emulators.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, motion.spring);
    }
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.base,
          { backgroundColor: fill, borderBottomColor: edge },
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {icon ? `${icon} ` : ''}
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    // Content area stays >= 56dp; the edge is extra.
    minHeight: touchTarget.primary + EDGE_HEIGHT,
    borderRadius: radius.button,
    borderBottomWidth: EDGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    // A transparent edge (instead of width 0) keeps layout height stable, so
    // siblings below never jump while the button sinks.
    transform: [{ translateY: EDGE_HEIGHT }],
    borderBottomColor: 'transparent',
  },
  label: {
    ...typography.button,
    color: colors.ink,
  },
});
