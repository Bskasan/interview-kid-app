import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { strings } from '@/lib/strings';
import { colors, spacing, typography } from '@/theme';

/**
 * Temporary Phase 0 preview screen so the design system can be verified on-device
 * (tokens, press physics, haptics, disabled state, mascot). Replaced by the real
 * Home screen in Phase 1.
 */
export default function Index() {
  const [cheering, setCheering] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{strings.home.title}</Text>
      <Mascot speech={cheering ? strings.exercise.correct : strings.home.greeting} />
      <View style={styles.spacer} />
      <ChunkyButton
        label={strings.exercise.watchFirst}
        onPress={() => {}}
        disabled
        style={styles.button}
      />
      <ChunkyButton
        label={strings.exercise.startQuiz}
        icon="⭐"
        onPress={() => setCheering((c) => !c)}
        style={styles.button}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginTop: spacing.md,
  },
});
