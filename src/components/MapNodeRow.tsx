/**
 * One row of the progress map: the row's own connector segments (entry curve
 * + exit stub — virtualization-safe, no cross-row measurement) and the round
 * lesson node with its state visuals: 🔒 locked, number when open, pulse on
 * the current node, stars underneath once earned. Never color alone.
 */
import { StarRow } from '@/components/StarRow';
import { MAP_CONNECTOR_WIDTH, MAP_NODE_SIZE, MAP_ROW_HEIGHT } from '@/constants/map';
import { QUESTIONS_PER_ATTEMPT } from '@/constants/quiz';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { usePulse } from '@/hooks/usePulse';
import { entryPath, exitPath, NODE_CENTER_Y, nodeCenterX } from '@/lib/mapPath';
import { type MapNodeState } from '@/lib/unlock';
import { colors, radius, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const nodeStyles: Record<MapNodeState, { backgroundColor: string; borderColor: string }> = {
  locked: { backgroundColor: colors.border, borderColor: colors.border },
  unlocked: { backgroundColor: colors.sky, borderColor: colors.skyDark },
  current: { backgroundColor: colors.sky, borderColor: colors.skyDark },
  completed: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
};

type MapNodeRowProps = {
  lesson: Lesson;
  index: number;
  state: MapNodeState;
  stars: number;
  width: number;
  isLast: boolean;
  onPress: () => void;
};

export function MapNodeRow({
  lesson,
  index,
  state,
  stars,
  width,
  isLast,
  onPress,
}: MapNodeRowProps) {
  const { t } = useTranslation(['map', 'home']);
  const reduceMotion = useReducedMotion();
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();

  // The current node breathes gently to say "you are here"; reduced motion
  // swaps the loop for a static sun-colored highlight ring.
  const pulse = usePulse(state === 'current', 1.07);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const centerX = nodeCenterX(index, width);
  const entry = entryPath(index, width);
  const exit = exitPath(index, width, isLast);

  const title = t('home:lessonTitle', { number: lesson.lessonNumber, author: lesson.author });
  const stateText =
    state === 'locked'
      ? t('map:stateLocked')
      : state === 'completed'
        ? t('map:stateStars', { stars, total: QUESTIONS_PER_ATTEMPT })
        : t('map:stateOpen');
  const staticRing = state === 'current' && reduceMotion;

  return (
    <View style={styles.row}>
      <Svg width={width} height={MAP_ROW_HEIGHT} style={StyleSheet.absoluteFill}>
        {entry ? (
          <Path
            d={entry}
            stroke={colors.border}
            strokeWidth={MAP_CONNECTOR_WIDTH}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        {exit ? (
          <Path d={exit} stroke={colors.border} strokeWidth={MAP_CONNECTOR_WIDTH} fill="none" />
        ) : null}
      </Svg>
      <Animated.View
        style={[
          styles.nodeSlot,
          { left: centerX - MAP_NODE_SIZE / 2, top: NODE_CENTER_Y - MAP_NODE_SIZE / 2 },
          animatedStyle,
          pulseStyle,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={t('map:nodeA11y', { title, state: stateText })}
          accessibilityState={{ disabled: false, selected: state === 'current' }}
          style={[styles.node, nodeStyles[state], staticRing && styles.staticRing]}
        >
          {state === 'locked' ? (
            <Text style={styles.lockGlyph} maxFontSizeMultiplier={1}>
              🔒
            </Text>
          ) : (
            <Text style={styles.number} maxFontSizeMultiplier={1.2}>
              {lesson.lessonNumber}
            </Text>
          )}
        </Pressable>
      </Animated.View>
      {stars > 0 && state !== 'locked' ? (
        <View style={[styles.starsSlot, { left: centerX - MAP_NODE_SIZE / 2 }]}>
          <StarRow earned={stars} total={QUESTIONS_PER_ATTEMPT} size={14} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: MAP_ROW_HEIGHT,
  },
  nodeSlot: {
    position: 'absolute',
    width: MAP_NODE_SIZE,
    height: MAP_NODE_SIZE,
  },
  node: {
    width: MAP_NODE_SIZE,
    height: MAP_NODE_SIZE,
    borderRadius: MAP_NODE_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticRing: {
    borderWidth: 4,
    borderColor: colors.sun,
  },
  lockGlyph: {
    fontSize: 26,
  },
  // Ink on primary/sky passes the contrast policy (same pairing as buttons).
  number: {
    ...typography.subtitle,
    color: colors.ink,
  },
  // The connector's exit stub runs down this exact column, so the stars sit on
  // a background chip instead of having the path line cross the glyphs.
  starsSlot: {
    position: 'absolute',
    top: NODE_CENTER_Y + MAP_NODE_SIZE / 2 + 2,
    width: MAP_NODE_SIZE,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
  },
});
