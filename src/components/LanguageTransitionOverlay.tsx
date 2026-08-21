/**
 * Full-screen overlay for the animated language change: fades in over the whole
 * app, bounces the mascot while i18next switches underneath at full opacity,
 * then fades out. Blocks all interaction while visible; reduced motion swaps
 * instantly without ever showing it.
 */
import { Mascot } from '@/components/Mascot';
import { BOUNCE_HALF_MS, BOUNCE_RISE } from '@/constants/languageSwitch';
import { LANGUAGE_TRANSITION } from '@/constants/timing';
import i18n, { type AppLanguage } from '@/i18n';
import { useLanguageTransitionStore } from '@/store/languageTransitionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, motion, spacing, typography } from '@/theme';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function LanguageTransitionOverlay() {
  const pending = useLanguageTransitionStore((state) => state.pending);
  if (!pending) {
    return null;
  }
  // Keyed by target: a shell instance belongs to exactly one transition, so
  // everything captured at mount (label language, timers) stays frozen.
  return <OverlayShell key={pending} target={pending} />;
}

function OverlayShell({ target }: { target: AppLanguage }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const mascotScale = useSharedValue(0.6);
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Defense in depth: the switch never engages the store under reduced
    // motion, but if anything else ever calls begin(), still swap instantly.
    if (reduceMotion) {
      useSettingsStore.getState().setLanguage(target);
      useLanguageTransitionStore.getState().finish();
      return;
    }
    opacity.value = withTiming(1, { duration: LANGUAGE_TRANSITION.fadeInMs });
    mascotScale.value = withSpring(1, motion.springSoft);
    bounce.value = withRepeat(withTiming(BOUNCE_RISE, { duration: BOUNCE_HALF_MS }), -1, true);

    // JS timers (not animation callbacks) drive the sequence: the swap and the
    // unmount must happen even if a frame is dropped, and they keep the store
    // and i18next writes off the UI thread path.
    const swapTimer = setTimeout(() => {
      useSettingsStore.getState().setLanguage(target);
    }, LANGUAGE_TRANSITION.swapAtMs);
    const fadeOutTimer = setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: LANGUAGE_TRANSITION.totalMs - LANGUAGE_TRANSITION.fadeOutAtMs,
      });
    }, LANGUAGE_TRANSITION.fadeOutAtMs);
    const finishTimer = setTimeout(() => {
      useLanguageTransitionStore.getState().finish();
    }, LANGUAGE_TRANSITION.totalMs);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [reduceMotion, target, opacity, mascotScale, bounce]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scale: mascotScale.value }],
  }));

  // Fixed to the TARGET language on purpose: the child sees the new language
  // immediately, and the line cannot flip mid-hold when i18n changes beneath.
  const line = i18n.getFixedT(target, 'common')('languageChanging');

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents="auto"
      accessibilityViewIsModal
    >
      <Animated.View style={mascotStyle}>
        <Mascot size={96} />
      </Animated.View>
      <Text style={styles.line} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.4}>
        {line}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    // Above the error banner (10/6): an opaque sub-second cover must not have
    // a tappable banner floating on top of it.
    zIndex: 20,
    elevation: 8,
  },
  line: {
    ...typography.subtitle,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
