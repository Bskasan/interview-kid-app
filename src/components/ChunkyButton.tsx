import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { colors, radius, spacing, touchTarget, typography } from '@/theme';

/** Height of the darker "3D" bottom edge that collapses while pressed. */
const EDGE_HEIGHT = 4;

const variants = {
  primary: { fill: colors.primary, edge: colors.primaryDark },
  sky: { fill: colors.sky, edge: colors.skyDark },
  // No `coral` variant on purpose: no text color passes 4.5:1 on coral.
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
};

export function ChunkyButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  accessibilityLabel,
}: Props) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback({ disabled });
  const { fill, edge } = disabled ? { fill: colors.border, edge: colors.muted } : variants[variant];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.base,
          { backgroundColor: fill, borderBottomColor: edge },
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.4}>
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
