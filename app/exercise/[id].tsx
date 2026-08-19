import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { strings } from '@/lib/strings';
import { colors, spacing, typography } from '@/theme';

/**
 * Temporary Phase 1 placeholder so Home navigation is testable end-to-end.
 * Replaced by the real Exercise screen (video + quiz) in Phase 2.
 */
export default function ExerciseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Mascot size={96} speech={strings.exercise.comingSoon} />
        <Text style={styles.caption}>📚 {typeof id === 'string' ? id : ''}</Text>
      </View>
      <ChunkyButton label={strings.common.back} icon="⬅️" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  caption: {
    ...typography.caption,
    color: colors.muted,
  },
});
