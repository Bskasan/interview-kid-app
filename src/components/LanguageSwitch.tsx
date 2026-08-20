/**
 * Language toggle: one pill track flanked by fixed TR/EN code labels, with a
 * sliding knob that shows the current language's flag. Tapping anywhere on the
 * control toggles and starts the animated transition; the current side's label
 * is bold ink, and state is spoken via the label — never color alone.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { isAppLanguage, type AppLanguage } from '@/i18n';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { useLanguageTransitionStore } from '@/store/languageTransitionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, motion, radius, spacing, typography } from '@/theme';

// Flag emoji denote countries, not languages — accepted for a two-language
// kids' app because recognizability wins over precision at this age.
const FLAGS: Record<AppLanguage, string> = { tr: '🇹🇷', en: '🇬🇧' };

// The knob overhangs the track like a physical switch cap; the track area is
// knob-sized so the overhang needs no overflow tricks.
const TRACK_WIDTH = 110;
const TRACK_HEIGHT = 52;
const KNOB_SIZE = 60;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE;
// The knob's flag crossfades to the target language around mid-slide.
const FLAG_SWAP_START = 0.42;
const FLAG_SWAP_END = 0.58;

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const pending = useLanguageTransitionStore((state) => state.pending);
  const active = isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'tr';
  // pending ?? active: the knob starts sliding on the tap itself, before the
  // transition overlay fades in above it.
  const shown = pending ?? active;
  const transitioning = pending !== null;
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback({ disabled: transitioning });

  const progress = useSharedValue(shown === 'en' ? 1 : 0);
  useEffect(() => {
    const target = shown === 'en' ? 1 : 0;
    progress.value = reduceMotion ? target : withSpring(target, motion.spring);
  }, [shown, reduceMotion, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, KNOB_TRAVEL]) }],
  }));
  const trFlagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [FLAG_SWAP_START, FLAG_SWAP_END],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));
  const enFlagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [FLAG_SWAP_START, FLAG_SWAP_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const toggle = () => {
    // `pending` is set synchronously and `begin` is idempotent, so the second
    // tap of a rapid double-tap lands here as a no-op — one toggle per ceremony.
    if (transitioning) {
      return;
    }
    const next: AppLanguage = shown === 'tr' ? 'en' : 'tr';
    if (reduceMotion) {
      // Instant swap, no overlay — the transition is decoration, not flow.
      useSettingsStore.getState().setLanguage(next);
      return;
    }
    useLanguageTransitionStore.getState().begin(next);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={toggle}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={transitioning}
        // Not a "switch": that role announces on/off, and neither language is
        // an off state. A button with an explicit label says exactly what a
        // tap does.
        accessibilityRole="button"
        accessibilityLabel={t(`languageToggleA11y.${shown}`)}
        accessibilityState={{ disabled: transitioning, busy: transitioning }}
        style={styles.row}
      >
        <SideLabel language="tr" active={shown === 'tr'} />
        <View style={styles.trackArea}>
          <View style={styles.track} />
          <Animated.View style={[styles.knob, knobStyle]}>
            <Animated.View style={trFlagStyle}>
              <Flag language="tr" />
            </Animated.View>
            <Animated.View style={[styles.flagOverlay, enFlagStyle]}>
              <Flag language="en" />
            </Animated.View>
          </Animated.View>
        </View>
        <SideLabel language="en" active={shown === 'en'} />
      </Pressable>
    </Animated.View>
  );
}

function SideLabel({ language, active }: { language: AppLanguage; active: boolean }) {
  return (
    <Text
      style={[styles.sideLabel, active ? styles.sideLabelActive : null]}
      maxFontSizeMultiplier={1.2}
    >
      {language.toUpperCase()}
    </Text>
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Fixed width so the bold/regular swap never nudges the track sideways.
  sideLabel: {
    ...typography.caption,
    color: colors.muted,
    width: 28,
    textAlign: 'center',
  },
  sideLabelActive: {
    color: colors.ink,
    fontWeight: '800',
  },
  trackArea: {
    width: TRACK_WIDTH,
    height: KNOB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  knob: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  flagOverlay: {
    position: 'absolute',
  },
  flag: {
    fontSize: 26,
    lineHeight: 32,
  },
});
