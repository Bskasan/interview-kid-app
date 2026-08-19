import { StyleSheet, Text, View } from 'react-native';
import { strings } from '@/lib/strings';
import { colors, radius, spacing, typography } from '@/theme';

export function OfflineBanner() {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{strings.home.offlineBanner}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.sun,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.ink,
    textAlign: 'center',
  },
});
