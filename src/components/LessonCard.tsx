/**
 * One Home-list lesson row: thumbnail, render-time translated title, a star
 * row for the best score and a status pill derived from the persisted
 * progress store. Exports its fixed dimensions for FlatList's getItemLayout.
 */
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { QUESTIONS_PER_ATTEMPT } from '@/constants/quiz';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { handleError } from '@/lib/errors/handleError';
import { useProgressStore } from '@/store/progressStore';
import { colors, radius, spacing, typography } from '@/theme';
import { clamp } from '@/utils/clamp';
import type { Lesson } from '@/types/lesson';

/** Fixed dimensions exported for FlatList's getItemLayout and the skeleton. */
export const LESSON_CARD_HEIGHT = 120;
export const LESSON_CARD_GAP = spacing.md;
export const LESSON_CARD_THUMB_SIZE = 72;

type Status = 'none' | 'attempted' | 'earned' | 'perfect';

// Pills carry meaning via icon + text; the colored border is only an accent.
// Labels are keys, resolved at render time so a language switch re-labels live.
const statusPill: Record<
  Exclude<Status, 'none'>,
  { labelKey: 'keepGoing' | 'badgeEarned' | 'badgePerfect'; borderColor: string }
> = {
  attempted: { labelKey: 'keepGoing', borderColor: colors.coral },
  earned: { labelKey: 'badgeEarned', borderColor: colors.sun },
  perfect: { labelKey: 'badgePerfect', borderColor: colors.grape },
};

type Props = {
  lesson: Lesson;
  onPress: () => void;
};

export function LessonCard({ lesson, onPress }: Props) {
  const { t } = useTranslation('home');
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();
  // Until hydration completes we render the neutral state rather than "never tried".
  const result = useProgressStore((s) => (s.hasHydrated ? s.results[lesson.id] : undefined));

  const status: Status = !result ? 'none' : result.badge === 'none' ? 'attempted' : result.badge;
  // Stars shown before any attempt match the quiz length.
  const total = result?.total ?? QUESTIONS_PER_ATTEMPT;
  const best = clamp(result?.best ?? 0, 0, total);
  const stars = '⭐'.repeat(best) + '☆'.repeat(total - best);
  const pill = status === 'none' ? null : statusPill[status];
  const title = t('lessonTitle', { number: lesson.lessonNumber, author: lesson.author });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={t('lessonCardA11y', { title, status: t(`lessonStatus.${status}`) })}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Image
          source={{ uri: lesson.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          accessible={false}
          // Silent: the bordered placeholder behind the image is the fallback
          // UI; the log line keeps the failure observable.
          onError={(event) =>
            handleError(event?.error ?? event, {
              context: `lesson-thumbnail.${lesson.id}`,
              code: 'MEDIA',
              severity: 'silent',
            })
          }
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.4}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.stars} accessible={false} maxFontSizeMultiplier={1.4}>
              {stars}
            </Text>
            {pill ? (
              <View style={[styles.pill, { borderColor: pill.borderColor }]}>
                <Text style={styles.pillLabel} maxFontSizeMultiplier={1.4}>
                  {t(pill.labelKey)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: LESSON_CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  thumbnail: {
    width: LESSON_CARD_THUMB_SIZE,
    height: LESSON_CARD_THUMB_SIZE,
    borderRadius: radius.button,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    color: colors.ink,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stars: {
    fontSize: 18,
    letterSpacing: 2,
    color: colors.muted,
  },
  pill: {
    borderWidth: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  pillLabel: {
    ...typography.caption,
    color: colors.ink,
  },
});
