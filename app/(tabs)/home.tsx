/**
 * Dashboard tab (Ana Sayfa): read-aloud mascot greeting, streak and total-star
 * cards, and one big CTA into the exercises tab. The star count animates up
 * each time the tab gains focus (static under reduced motion).
 */
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { useCountUp } from '@/hooks/useCountUp';
import { totalStars } from '@/lib/scoring';
import { useHydratedResults } from '@/store/progressStore';
import { useStreakStore } from '@/store/streakStore';
import { colors, radius, spacing, typography } from '@/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const results = useHydratedResults();
  const streakCount = useStreakStore((state) => (state.hasHydrated ? state.count : 0));
  const starsTarget = totalStars(results);

  // Replay the count-up on every visit to the tab, not only on first mount.
  const [focusKey, setFocusKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocusKey((key) => key + 1);
    }, []),
  );

  const stars = useCountUp(starsTarget, { animate: !reduceMotion, restartKey: focusKey });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Mascot size={64} speech={t('greeting')} readAloud />
        <View style={styles.cards}>
          <View
            style={styles.card}
            accessible
            accessibilityLabel={t('streak', { count: streakCount })}
          >
            <Text style={styles.cardEmoji} maxFontSizeMultiplier={1}>
              🔥
            </Text>
            <Text style={styles.cardValue} maxFontSizeMultiplier={1.4}>
              {streakCount}
            </Text>
            <Text style={styles.cardLine} maxFontSizeMultiplier={1.4} numberOfLines={2}>
              {t('streak', { count: streakCount })}
            </Text>
          </View>
          <View
            style={styles.card}
            accessible
            accessibilityLabel={t('starsA11y', { count: starsTarget })}
          >
            <Text style={styles.cardEmoji} maxFontSizeMultiplier={1}>
              ⭐
            </Text>
            <Text style={styles.cardValue} maxFontSizeMultiplier={1.4}>
              {stars}
            </Text>
            <Text style={styles.cardLine} maxFontSizeMultiplier={1.4} numberOfLines={2}>
              {t('starsA11y', { count: starsTarget })}
            </Text>
          </View>
        </View>
      </View>
      <ChunkyButton
        label={t('cta')}
        icon="🧩"
        onPress={() => router.navigate('/(tabs)/exercises')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  cardValue: {
    ...typography.title,
    color: colors.ink,
  },
  cardLine: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
});
