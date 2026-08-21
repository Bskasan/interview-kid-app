/**
 * Settings tab: the app's only language toggle and the app version.
 * Deliberately tiny — nothing fake, no dead toggles.
 */
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { colors, radius, spacing, typography } from '@/theme';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { t } = useTranslation('settings');
  const version = Constants.expoConfig?.version ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.4}>
        {t('title')}
      </Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {t('languageLabel')}
        </Text>
        <LanguageSwitch />
      </View>
      <View style={styles.row} accessible accessibilityLabel={`${t('versionLabel')} ${version}`}>
        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.4}>
          {t('versionLabel')}
        </Text>
        <Text style={styles.rowValue} maxFontSizeMultiplier={1.4}>
          {version}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.bodyBold,
    color: colors.ink,
    flexShrink: 1,
  },
  rowValue: {
    ...typography.body,
    color: colors.muted,
  },
});
