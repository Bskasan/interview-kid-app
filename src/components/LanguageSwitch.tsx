/**
 * Home-header language picker: one big square tile per language with a flag
 * and the language's own name, so a child who can't read the current language
 * still finds theirs. Tapping the other tile starts the animated transition;
 * selection is border + check badge, never color alone.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { TOUCH_TARGET } from '@/constants/layout';
import { SUPPORTED_LANGUAGES, isAppLanguage, type AppLanguage } from '@/i18n';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { useLanguageTransitionStore } from '@/store/languageTransitionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, spacing, typography } from '@/theme';

// Flag emoji denote countries, not languages — accepted for a two-language
// kids' app because recognizability wins over precision at this age.
const FLAGS: Record<AppLanguage, string> = { tr: '🇹🇷', en: '🇬🇧' };

// Language-neutral glyph (AnswerTile badge pattern), not copy — no t() needed.
const CHECK_GLYPH = '✓';

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const transitioning = useLanguageTransitionStore((state) => state.pending !== null);
  const active = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'tr';

  const choose = (language: AppLanguage) => {
    if (language === active || transitioning) {
      return;
    }
    if (reduceMotion) {
      // Instant swap, no overlay — the transition is decoration, not flow.
      useSettingsStore.getState().setLanguage(language);
      return;
    }
    useLanguageTransitionStore.getState().begin(language);
  };

  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('languagePickerA11y')}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <Tile
          key={language}
          language={language}
          label={t(`language.${language}`)}
          selected={language === active}
          disabled={transitioning}
          onPress={() => choose(language)}
        />
      ))}
    </View>
  );
}

type TileProps = {
  language: AppLanguage;
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function Tile({ language, label, selected, disabled, onPress }: TileProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback({ disabled });
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, selected, disabled }}
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.tile,
          selected && styles.tileSelected,
          pressed && !disabled && styles.tilePressed,
        ]}
      >
        <Flag language={language} />
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {label}
        </Text>
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.checkGlyph} maxFontSizeMultiplier={1}>
              {CHECK_GLYPH}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// Isolated so a bundled-SVG fallback (react-native-svg is already a dependency)
// is a one-function swap if a device renders flag emoji as letter pairs.
function Flag({ language }: { language: AppLanguage }) {
  return (
    <Text style={styles.flag} maxFontSizeMultiplier={1}>
      {FLAGS[language]}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Border width is identical in both states so selection never shifts layout.
  tile: {
    minWidth: TOUCH_TARGET.primary + 8,
    minHeight: TOUCH_TARGET.primary + 8,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  tileSelected: {
    borderColor: colors.primary,
  },
  tilePressed: {
    backgroundColor: colors.background,
  },
  flag: {
    fontSize: 24,
    lineHeight: 30,
  },
  label: {
    ...typography.caption,
    color: colors.ink,
  },
  check: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ink on primary keeps the contrast policy; the disc itself marks selection.
  checkGlyph: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
});
