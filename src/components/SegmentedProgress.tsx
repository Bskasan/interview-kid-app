import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  /** 1-based index of the question on screen. */
  current: number;
  total: number;
};

/** "Soru 2/3" + one segment per question: done = green, current = blue, ahead = beige. */
export function SegmentedProgress({ current, total }: Props) {
  const { t } = useTranslation('exercise');
  const label = t('question', { current, total });
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, index) => {
          const state =
            index < current - 1
              ? colors.primary
              : index === current - 1
                ? colors.sky
                : colors.border;
          return <View key={index} style={[styles.segment, { backgroundColor: state }]} />;
        })}
      </View>
      <Text style={styles.label} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.caption,
    color: colors.ink,
  },
});
