/**
 * The app's friendly guide: a fox emoji in a bordered circle with an optional
 * speech bubble, shown on every screen. Screen readers get one image whose
 * label is the speech line; `readAloud` adds a SpeakButton beside the bubble
 * (outside the image node, so it stays focusable) for pre-readers.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SpeakButton } from '@/components/SpeakButton';
import { colors, radius, spacing, typography } from '@/theme';

// Original generic fox — deliberately not an owl or any existing app's character.
// Exported so the one other face render (error banner) can't drift to a
// different character.
export const MASCOT_FACE = '🦊';

type Props = {
  /** Diameter of the face circle, dp. */
  size?: number;
  /** Optional short line shown in a speech bubble next to the face. */
  speech?: string;
  /** Adds a read-aloud button for lines a child must understand alone. */
  readAloud?: boolean;
};

export function Mascot({ size = 64, speech, readAloud = false }: Props) {
  const { t } = useTranslation();
  const figure = (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={speech ? t('mascotSays', { text: speech }) : t('mascotA11y')}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.55 }}>{MASCOT_FACE}</Text>
      </View>
      {speech ? (
        <View style={styles.bubble}>
          <Text style={styles.speech}>{speech}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!speech || !readAloud) {
    return figure;
  }
  return (
    <View style={styles.readAloudRow}>
      {figure}
      <SpeakButton text={speech} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readAloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  circle: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexShrink: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  speech: {
    ...typography.bodyBold,
    color: colors.ink,
  },
});
