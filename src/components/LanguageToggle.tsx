/**
 * Two-segment language pill for the Home header. Each language is shown in its
 * own name so a child (or parent) who can't read the current language still
 * finds their own. Selection is never color-alone: the active segment is
 * filled and bold, and the radio a11y state carries it for screen readers.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TOUCH_TARGET } from '@/constants/layout';
import { SUPPORTED_LANGUAGES, isAppLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, typography } from '@/theme';

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const active = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'tr';

  return (
    <View
      style={styles.pill}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('languagePickerA11y')}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const selected = language === active;
        return (
          <Pressable
            key={language}
            onPress={() => setLanguage(language)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`language.${language}`)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            <Text
              style={[styles.label, selected && styles.labelActive]}
              maxFontSizeMultiplier={1.2}
            >
              {t(`language.${language}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: {
    minHeight: TOUCH_TARGET.compact,
    minWidth: 88,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ink on sun keeps ≥4.5:1; the fill (not color alone) marks the selection.
  segmentActive: {
    backgroundColor: colors.sun,
  },
  label: {
    ...typography.body,
    color: colors.ink,
  },
  labelActive: {
    ...typography.bodyBold,
    color: colors.ink,
  },
});
