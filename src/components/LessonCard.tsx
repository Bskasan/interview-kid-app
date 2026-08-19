import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { strings } from '@/lib/strings';
import { useProgressStore } from '@/store/progressStore';
import { colors, radius, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';

/** Fixed dimensions exported for FlatList's getItemLayout. */
export const LESSON_CARD_HEIGHT = 120;
export const LESSON_CARD_GAP = spacing.md;

const THUMB_SIZE = 72;
/** Stars shown before any attempt; matches the quiz length. */
const DEFAULT_TOTAL = 3;

type Status = 'none' | 'attempted' | 'earned' | 'perfect';

// Pills carry meaning via icon + text; the colored border is only an accent (ADR 0010).
const statusPill: Record<Exclude<Status, 'none'>, { label: string; borderColor: string }> = {
  attempted: { label: strings.home.keepGoing, borderColor: colors.coral },
  earned: { label: strings.home.badgeEarned, borderColor: colors.sun },
  perfect: { label: strings.home.badgePerfect, borderColor: colors.grape },
};

type Props = {
  lesson: Lesson;
  onPress: () => void;
};

export function LessonCard({ lesson, onPress }: Props) {
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();
  // Until hydration completes we render the neutral state rather than "never tried".
  const result = useProgressStore((s) => (s.hasHydrated ? s.results[lesson.id] : undefined));

  const status: Status = !result ? 'none' : result.badge === 'none' ? 'attempted' : result.badge;
  const total = result?.total ?? DEFAULT_TOTAL;
  const best = Math.max(0, Math.min(result?.best ?? 0, total));
  const stars = '⭐'.repeat(best) + '☆'.repeat(total - best);
  const pill = status === 'none' ? null : statusPill[status];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={strings.a11y.lessonCard(lesson.title, strings.a11y.lessonStatus[status])}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Image
          source={{ uri: lesson.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
          accessible={false}
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {lesson.title}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.stars} accessible={false}>
              {stars}
            </Text>
            {pill ? (
              <View style={[styles.pill, { borderColor: pill.borderColor }]}>
                <Text style={styles.pillLabel}>{pill.label}</Text>
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
    width: THUMB_SIZE,
    height: THUMB_SIZE,
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
