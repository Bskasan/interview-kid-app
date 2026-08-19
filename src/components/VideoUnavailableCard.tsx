import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { colors, radius, spacing } from '@/theme';

type Props = {
  /** Recreates the player for another attempt. */
  onRetry: () => void;
  /** The child chooses to take the quiz without the video. */
  onContinue: () => void;
};

/**
 * Replaces the video area when the video can't play (error, load timeout, or
 * offline on entry). The child decides what happens next — retry or continue
 * without the video — instead of the flow silently skipping ahead. The copy
 * says the questions are about this video, so the choice is informed.
 */
export function VideoUnavailableCard({ onRetry, onContinue }: Props) {
  const { t } = useTranslation(['exercise', 'common']);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Mascot size={72} speech={t('videoUnavailable')} />
      </View>
      <View style={styles.actions}>
        <ChunkyButton label={t('common:retry')} icon="🔄" onPress={onRetry} />
        <ChunkyButton label={t('videoSkip')} icon="➡️" variant="sky" onPress={onContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
