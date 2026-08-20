/**
 * Round, always-visible exit control for the exercise flow (top-left on both
 * the video and quiz stages). It only *opens* the confirm sheet — leaving is
 * never one accidental tap.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { TOUCH_TARGET } from '@/constants/layout';
import { colors, radius } from '@/theme';

export function ExitButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation('exercise');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('exitButton')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.icon} maxFontSizeMultiplier={1}>
        🏠
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET.compact,
    height: TOUCH_TARGET.compact,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // Soft shadow so the control reads as floating above the stage.
    elevation: 3,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  pressed: {
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 22,
  },
});
