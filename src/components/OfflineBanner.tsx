/**
 * Slim "you're offline" banner shown above the Home list while the device has
 * no connection; announced politely to screen readers.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export function OfflineBanner() {
  const { t } = useTranslation('home');
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{t('offlineBanner')}</Text>
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
