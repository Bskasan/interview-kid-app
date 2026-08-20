/**
 * Speech bubble anchored to a map node: thumbnail, title and star row, plus
 * a Start button when the lesson is open or an encouraging line when locked.
 * Rendered as an absolute overlay over the map (one at a time); tapping the
 * backdrop closes it. Anchor coordinates are computed, never measured.
 */
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { ChunkyButton } from '@/components/ChunkyButton';
import { SpeakButton } from '@/components/SpeakButton';
import { StarRow } from '@/components/StarRow';
import { MAP_NODE_SIZE } from '@/constants/map';
import { QUESTIONS_PER_ATTEMPT } from '@/constants/quiz';
import { reportImageError } from '@/lib/errors/handleError';
import { type MapNodeState } from '@/lib/unlock';
import { colors, radius, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';
import { clamp } from '@/utils/clamp';

const BUBBLE_MAX_WIDTH = 340;
const POINTER_SIZE = 16;
/**
 * Worst-case bubble height, used to decide above/below placement and to keep
 * the Start button inside the viewport: 2×16 padding + 52 header (thumbnail /
 * two-line title / stars) + 12 gap + 60 button, plus slack for the capped
 * font growth. Over-estimating only flips the bubble upwards a little sooner;
 * under-estimating puts the primary action off-screen with no way to scroll
 * to it (a scroll closes the bubble).
 */
const PLACEMENT_ESTIMATE = 240;

type Props = {
  lesson: Lesson;
  state: MapNodeState;
  stars: number;
  /** Node center, in the overlay container's coordinate space. */
  anchor: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  onStart: () => void;
  onClose: () => void;
};

export function LessonBubble({
  lesson,
  state,
  stars,
  anchor,
  containerWidth,
  containerHeight,
  onStart,
  onClose,
}: Props) {
  const { t } = useTranslation(['map', 'home']);
  const locked = state === 'locked';
  const title = t('home:lessonTitle', { number: lesson.lessonNumber, author: lesson.author });

  const width = Math.min(BUBBLE_MAX_WIDTH, containerWidth - 2 * spacing.lg);
  const left = clamp(
    anchor.x - width / 2,
    spacing.lg,
    Math.max(spacing.lg, containerWidth - spacing.lg - width),
  );
  // Below the node by default; flip above when the node sits low enough that a
  // worst-case card would not fit under it.
  const nodeBottom = anchor.y + MAP_NODE_SIZE / 2;
  const nodeTop = anchor.y - MAP_NODE_SIZE / 2;
  const below = nodeBottom + PLACEMENT_ESTIMATE < containerHeight;
  // Whichever way it opens, the offset is clamped so a worst-case card still
  // ends inside the viewport — the Start button must never be unreachable
  // (scrolling to it is impossible: a scroll closes the bubble).
  const maxOffset = Math.max(spacing.sm, containerHeight - PLACEMENT_ESTIMATE - spacing.sm);
  const topWhenBelow = clamp(nodeBottom + POINTER_SIZE / 2 + 2, spacing.sm, maxOffset);
  const bottomWhenAbove = clamp(
    containerHeight - nodeTop + POINTER_SIZE / 2 + 2,
    spacing.sm,
    maxOffset,
  );
  const pointerX = clamp(
    anchor.x - POINTER_SIZE / 2,
    left + radius.card,
    left + width - radius.card - POINTER_SIZE,
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('map:closeA11y')}
      />
      <Animated.View
        entering={FadeIn.duration(150).reduceMotion(ReduceMotion.System)}
        // The card swallows its own touches so a tap inside never closes.
        onStartShouldSetResponder={() => true}
        style={[
          styles.bubble,
          // maxHeight is the backstop for the estimate being wrong: the card
          // can never be taller than the map it sits in.
          {
            width,
            left,
            maxHeight: Math.max(PLACEMENT_ESTIMATE, containerHeight - 2 * spacing.sm),
          },
          below ? { top: topWhenBelow } : { bottom: bottomWhenAbove },
        ]}
      >
        <View
          style={[
            styles.pointer,
            { left: pointerX - left },
            below ? styles.pointerUp : styles.pointerDown,
          ]}
        />
        <View style={styles.headerRow}>
          <Image
            source={{ uri: lesson.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
            accessible={false}
            // Decorative: the bordered placeholder is the fallback UI.
            onError={(event) => reportImageError(event, `lesson-bubble.${lesson.id}`)}
          />
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.4}>
              {title}
            </Text>
            <StarRow earned={stars} total={QUESTIONS_PER_ATTEMPT} />
          </View>
          <SpeakButton text={title} />
        </View>
        {locked ? (
          <Text style={styles.lockedHint} maxFontSizeMultiplier={1.4}>
            {t('map:lockedHint')}
          </Text>
        ) : (
          <ChunkyButton label={t('map:start')} icon="▶️" onPress={onStart} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pointer: {
    position: 'absolute',
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
  pointerUp: {
    top: -POINTER_SIZE / 2 - 1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  pointerDown: {
    bottom: -POINTER_SIZE / 2 - 1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.border,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyBold,
    color: colors.ink,
  },
  lockedHint: {
    ...typography.bodyBold,
    color: colors.ink,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
