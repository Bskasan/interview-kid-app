import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '@/i18n';
import { FALLBACK_ERROR_TEXT, FALLBACK_OK_TEXT } from '@/lib/errors/fallbackText';
import { colors, motion, radius, spacing, touchTarget, typography } from '@/theme';
import { useErrorStore } from '@/store/errorStore';

const ENTER_OFFSET = -24;

/**
 * The one place runtime errors surface to the child: a calm top banner with the
 * mascot, a generic translated line and a big OK — plus "try again" when the
 * error carries a recovery action. Never shows codes, stacks, URLs or library
 * names. Mounted once in the root layout; a new error replaces the current one.
 */
export function GlobalErrorBanner() {
  const { t } = useTranslation(['errors', 'common']);
  const insets = useSafeAreaInsets();
  const current = useErrorStore((state) => state.current);
  const dismiss = useErrorStore((state) => state.dismiss);

  if (!current) {
    return null;
  }

  // If i18n itself is down, t() would echo raw keys at the child — the
  // hardcoded Turkish fallback is the documented exception for exactly this.
  const ready = i18n.isInitialized;
  const message = ready ? t(current.error.userMessageKey) : FALLBACK_ERROR_TEXT;
  const okLabel = ready ? t('ok') : FALLBACK_OK_TEXT;
  const retry = current.error.retry;

  const handleRetry = retry
    ? () => {
        dismiss();
        retry();
      }
    : undefined;

  return (
    <BannerShell key={current.id} topInset={insets.top}>
      <View style={styles.messageRow}>
        <Text style={styles.face} maxFontSizeMultiplier={1.2}>
          🦊
        </Text>
        <Text style={styles.message} maxFontSizeMultiplier={1.4}>
          {message}
        </Text>
      </View>
      <View style={styles.actions}>
        {handleRetry ? (
          <Pressable
            onPress={handleRetry}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel} maxFontSizeMultiplier={1.2}>
              🔄 {ready ? t('common:retry') : FALLBACK_OK_TEXT}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            styles.actionPrimary,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.actionLabel} maxFontSizeMultiplier={1.2}>
            {okLabel}
          </Text>
        </Pressable>
      </View>
    </BannerShell>
  );
}

/** Slide-and-settle entrance; instant under reduced motion. */
function BannerShell({ topInset, children }: { topInset: number; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(reduceMotion ? 0 : ENTER_OFFSET);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    offset.value = withSpring(0, motion.springSoft);
    opacity.value = withSpring(1, motion.springSoft);
  }, [reduceMotion, offset, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[styles.banner, { top: topInset + spacing.sm }, animatedStyle]}
      accessibilityLiveRegion="polite"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    // Above every screen, below nothing — the banner is the only overlay.
    zIndex: 10,
    elevation: 6,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  face: {
    fontSize: 28,
  },
  message: {
    ...typography.bodyBold,
    color: colors.ink,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  action: {
    minHeight: touchTarget.primary - 8,
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: colors.sun,
    borderColor: colors.sun,
  },
  actionPressed: {
    backgroundColor: colors.background,
  },
  actionLabel: {
    ...typography.bodyBold,
    color: colors.ink,
  },
});
