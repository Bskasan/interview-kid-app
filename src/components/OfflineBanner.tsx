/**
 * Slim "you're offline" banner shown above the exercises map while the device
 * has no connection; announced politely to screen readers.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export function OfflineBanner() {
  const { t } = useTranslation('home');
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      {/* Capped: the banner sits above the map and every line it grows by
          shortens the viewport the lesson bubble is placed against. */}
      <Text style={styles.text} maxFontSizeMultiplier={1.4}>
        {t('offlineBanner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.sun,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.ink,
    textAlign: 'center',
  },
});
