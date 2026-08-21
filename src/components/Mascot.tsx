/**
 * The app's friendly guide: a fox emoji in a bordered circle with an optional
 * speech bubble, shown on every screen. Screen readers get one image whose
 * label is the speech line; `readAloud` adds a SpeakButton beside the bubble
 * (outside the image node, so it stays focusable) for pre-readers.
 */
import { SpeakButton } from '@/components/SpeakButton';
import { MASCOT_FACE } from '@/constants/mascot';
import { colors, radius, spacing, typography } from '@/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

type MascotProps = {
  size?: number;
  speech?: string;
  readAloud?: boolean;
};

export function Mascot({ size = 64, speech, readAloud = false }: MascotProps) {
  const { t } = useTranslation();
  const withButton = !!speech && readAloud;
  const figure = (
    <View
      // Only the read-aloud row needs the figure to yield width; on the plain
      // path the parent is a column, where flexShrink would govern HEIGHT.
      style={[styles.row, withButton ? styles.figureFlexible : null]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={speech ? t('mascotSays', { text: speech }) : t('mascotA11y')}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Emoji must not scale with the system font or it bursts the circle. */}
        <Text style={{ fontSize: size * 0.55 }} maxFontSizeMultiplier={1}>
          {MASCOT_FACE}
        </Text>
      </View>
      {speech ? (
        <View style={styles.bubble}>
          <Text style={styles.speech} maxFontSizeMultiplier={1.4}>
            {speech}
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!withButton) {
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
    justifyContent: 'center',
    gap: spacing.sm,
    // Stretch gives the row a definite width even inside the centering parents
    // (welcome, result, sheets); without it the row is measured at-most and the
    // figure's shrink factor never engages, pushing the button off-screen.
    alignSelf: 'stretch',
  },
  figureFlexible: {
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
