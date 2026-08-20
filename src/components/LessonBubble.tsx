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
import { handleError } from '@/lib/errors/handleError';
import { type MapNodeState } from '@/lib/unlock';
import { colors, radius, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';

const BUBBLE_MAX_WIDTH = 340;
const POINTER_SIZE = 16;
/** Rough bubble height used only to decide above/below placement. */
const PLACEMENT_ESTIMATE = 200;

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
  const left = Math.min(
    Math.max(spacing.lg, anchor.x - width / 2),
    Math.max(spacing.lg, containerWidth - spacing.lg - width),
  );
  // Below the node by default; flip above when the node sits in the lower
  // part of the viewport (unknown viewport in tests → below + clamped).
  const nodeBottom = anchor.y + MAP_NODE_SIZE / 2;
  const nodeTop = anchor.y - MAP_NODE_SIZE / 2;
  const below = containerHeight === 0 || nodeBottom + PLACEMENT_ESTIMATE < containerHeight;
  const pointerX = Math.min(
    Math.max(anchor.x - POINTER_SIZE / 2, left + radius.card),
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
          { width, left },
          below
            ? { top: Math.max(spacing.sm, nodeBottom + POINTER_SIZE / 2 + 2) }
            : { bottom: Math.max(spacing.sm, containerHeight - nodeTop + POINTER_SIZE / 2 + 2) },
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
            // Silent: the bordered placeholder is the fallback UI; the log
            // line keeps the failure observable.
            onError={(event) =>
              handleError(event?.error ?? event, {
                context: `lesson-bubble.${lesson.id}`,
                code: 'MEDIA',
                severity: 'silent',
              })
            }
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
