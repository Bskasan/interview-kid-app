import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { strings } from '@/lib/strings';
import { colors, spacing, typography } from '@/theme';

/**
 * Temporary Phase 2 placeholder proving the quiz hands off its score correctly.
 * Phase 3 replaces this with the celebration screen (badge reveal, recordResult).
 */
export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId: string; correct: string; total: string }>();
  const correct = Number(params.correct) || 0;
  const total = Number(params.total) || 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        <Mascot size={96} speech={strings.result.score(correct, total)} />
        <Text style={styles.caption}>📚 {typeof params.lessonId === 'string' ? params.lessonId : ''}</Text>
      </View>
      <ChunkyButton
        label={strings.result.goHome}
        icon="🏠"
        onPress={() => router.replace('/')}
      />
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
