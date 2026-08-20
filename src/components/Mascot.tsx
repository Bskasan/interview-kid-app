/**
 * The app's friendly guide: a fox emoji in a bordered circle with an optional
 * speech bubble, shown on every screen. Screen readers get one image whose
 * label is the speech line.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

// Original generic fox — deliberately not an owl or any existing app's character.
const FACE = '🦊';

type Props = {
  /** Diameter of the face circle, dp. */
  size?: number;
  /** Optional short line shown in a speech bubble next to the face. */
  speech?: string;
};

export function Mascot({ size = 64, speech }: Props) {
  const { t } = useTranslation();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={speech ? t('mascotSays', { text: speech }) : t('mascotA11y')}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.55 }}>{FACE}</Text>
      </View>
      {speech ? (
        <View style={styles.bubble}>
          <Text style={styles.speech}>{speech}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
