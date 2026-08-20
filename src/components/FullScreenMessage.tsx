/**
 * Centered mascot + speech bubble with one optional action button — the shared
 * layout for full-screen error/empty states.
 */
import { StyleSheet, View } from 'react-native';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { spacing } from '@/theme';

type Props = {
  /** What the mascot says (error, empty, encouragement…). */
  speech: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function FullScreenMessage({ speech, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.message}>
        <Mascot size={96} speech={speech} />
      </View>
      {actionLabel && onAction ? (
        <ChunkyButton label={actionLabel} icon="🔄" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
