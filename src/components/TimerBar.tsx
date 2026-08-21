/**
 * Per-question countdown display: a shrinking bar that shifts green → sun →
 * coral as time runs low, with the remaining seconds shown beside it.
 */
import { colors, radius, spacing, typography } from '@/theme';
import { clamp } from '@/utils/clamp';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

type TimerBarProps = {
  /** 1 → 0 as the time runs out. */
  progress: number;
  remainingSeconds: number;
};

export function TimerBar({ progress, remainingSeconds }: TimerBarProps) {
  const { t } = useTranslation('exercise');
  const urgent = remainingSeconds <= 5;
  const fillColor = remainingSeconds > 10 ? colors.primary : urgent ? colors.coral : colors.sun;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('timeLeft', { count: remainingSeconds })}
    >
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamp(progress, 0, 1) * 100}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <Text style={styles.seconds} maxFontSizeMultiplier={1.4}>
        {remainingSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  track: {
    flex: 1,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  // Seconds stay ink at all times: coral text fails 4.5:1 on cream, and urgency
  // is already carried by the bar color + the shrinking width + the number itself.
  seconds: {
    ...typography.subtitle,
    color: colors.ink,
    minWidth: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
