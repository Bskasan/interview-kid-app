/**
 * One quiz answer tile: a big visual (emoji, drawn SVG shape, or photo with
 * emoji fallback) plus optional caption on a constant white chip, with press
 * feedback, a wrong-answer shake, and tint + border + ✓/✗ feedback states
 * that never rely on color alone and never obscure the visual.
 */
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import {
  optionA11yLabel,
  optionLabel,
  type AnswerOptionData,
  type OptionVisual,
} from '@/data/questions';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { reportImageError } from '@/lib/errors/handleError';
import { type AnswerFeedback } from '@/lib/quiz';
import { colors, radius, spacing, typography } from '@/theme';

// Feedback is never color-alone: the ✓/✗ badge + border shapes carry the meaning.
// Feedback colors only the ring AROUND the white visual chip (light tint fill +
// full-strength border), so a full-strength fill can never swallow same-colored
// artwork (e.g. the green star answering "Yeşil olan hangisi?").
const feedbackStyles = {
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  correct: { backgroundColor: colors.successTint, borderColor: colors.primary },
  wrongChoice: { backgroundColor: colors.dangerTint, borderColor: colors.coral },
  revealCorrect: { backgroundColor: colors.successTint, borderColor: colors.primary },
  lockedOut: { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.55 },
} as const;

const a11yPrefixes: Record<AnswerFeedback, string> = {
  idle: '',
  correct: '✓ ',
  wrongChoice: '✗ ',
  revealCorrect: '✓ ',
  lockedOut: '',
};

// Ink glyph on a surface disc: coral/primary appear only as the badge border,
// so the mark keeps ≥4.5:1 contrast in every state.
const badges: Partial<Record<AnswerFeedback, { glyph: string; borderColor: string }>> = {
  correct: { glyph: '✓', borderColor: colors.primaryDark },
  wrongChoice: { glyph: '✗', borderColor: colors.coral },
  revealCorrect: { glyph: '✓', borderColor: colors.primary },
};

// 5-point star centered in the 0–100 viewBox (outer r 46, inner r 20).
const STAR_POINTS =
  '50,4 61.8,33.8 93.7,35.8 69,56.2 77,87.2 50,70 23,87.2 31,56.2 6.3,35.8 38.2,33.8';
const TRIANGLE_POINTS = '50,8 92,88 8,88';

// Visual share of the tile's short side; the rest is chip padding + borders.
const VISUAL_RATIO = 0.55;

type Props = {
  option: AnswerOptionData;
  feedback: AnswerFeedback;
  onPress: () => void;
  width: number;
  height: number;
};

export function AnswerTile({ option, feedback, onPress, width, height }: Props) {
  const { t } = useTranslation('questions');
  const locked = feedback !== 'idle';
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback({ disabled: locked });
  const reduceMotion = useReducedMotion();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (feedback === 'wrongChoice' && !reduceMotion) {
      // Gentle shake — a wobble, not a punishment.
      shakeX.value = withSequence(
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [feedback, reduceMotion, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // The tile never shrinks below the touch floor; only the visual scales down,
  // so cramped screens cost artwork size, not tap accuracy. The ratio leaves
  // room for the chip's own padding and border inside the tile.
  const visualSize = Math.round(Math.min(width, height) * VISUAL_RATIO);
  const badge = badges[feedback];
  const label = optionLabel(option, t);

  return (
    <Animated.View style={[animatedStyle, shakeStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={locked}
        accessibilityRole="button"
        accessibilityLabel={a11yPrefixes[feedback] + optionA11yLabel(option, t)}
        accessibilityState={{
          disabled: locked,
          selected: feedback === 'correct' || feedback === 'wrongChoice',
        }}
        style={({ pressed }) => [
          styles.base,
          { width, height },
          feedbackStyles[feedback],
          pressed && !locked && styles.pressed,
        ]}
      >
        <View style={[styles.visualChip, { minWidth: visualSize + spacing.lg }]} accessible={false}>
          {option.visual ? (
            <View style={styles.content}>
              <TileVisual visual={option.visual} size={visualSize} />
              {label !== undefined ? (
                <Text
                  style={styles.caption}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.2}
                >
                  {label}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text
              style={styles.textOnly}
              numberOfLines={2}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.4}
            >
              {label}
            </Text>
          )}
        </View>
        {badge ? (
          <View style={[styles.badge, { borderColor: badge.borderColor }]}>
            <Text style={styles.badgeGlyph} maxFontSizeMultiplier={1}>
              {badge.glyph}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function TileVisual({ visual, size }: { visual: OptionVisual; size: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (visual.kind === 'emoji' || (visual.kind === 'image' && imageFailed)) {
    const emoji = visual.kind === 'emoji' ? visual.value : visual.fallbackEmoji;
    return (
      // Emoji must not scale with the system font or it bursts the fixed tile.
      <Text style={{ fontSize: size * 0.8, lineHeight: size }} maxFontSizeMultiplier={1}>
        {emoji}
      </Text>
    );
  }

  if (visual.kind === 'image') {
    return (
      <Image
        source={{ uri: visual.uri }}
        contentFit="cover"
        transition={200}
        // The emoji fallback keeps the question answerable.
        onError={(event) => {
          reportImageError(event, 'answer-tile.image');
          setImageFailed(true);
        }}
        style={{
          width: size,
          height: size,
          borderRadius: radius.button - 6,
          backgroundColor: colors.border,
        }}
      />
    );
  }

  const fill = colors[visual.color];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {visual.shape === 'circle' ? <Circle cx={50} cy={50} r={42} fill={fill} /> : null}
      {visual.shape === 'square' ? (
        <Rect x={10} y={10} width={80} height={80} rx={12} fill={fill} />
      ) : null}
      {visual.shape === 'triangle' ? <Polygon points={TRIANGLE_POINTS} fill={fill} /> : null}
      {visual.shape === 'star' ? <Polygon points={STAR_POINTS} fill={fill} /> : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    // Same width in every state (thick enough to read as feedback on its own),
    // so a state change never shifts layout.
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  visualChip: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.button - 6,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  caption: {
    ...typography.button,
    color: colors.ink,
    textAlign: 'center',
  },
  textOnly: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlyph: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
});
