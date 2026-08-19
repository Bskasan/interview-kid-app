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

/** Centered mascot + speech bubble with an optional single action — used for error/empty states. */
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
