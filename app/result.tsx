import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeReveal } from '@/components/BadgeReveal';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { computeOutcome } from '@/lib/scoring';
import { strings } from '@/lib/strings';
import { useProgressStore } from '@/store/progressStore';
import { colors, spacing, typography } from '@/theme';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId: string; correct: string; total: string }>();
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  // Params arrive as strings (or garbage on a bad deep link); scoring clamps further.
  const correct = Number.isFinite(Number(params.correct)) ? Number(params.correct) : 0;
  const total = Number.isFinite(Number(params.total)) ? Number(params.total) : 0;

  const { passed, badge } = computeOutcome(correct, total);
  const recordResult = useProgressStore((state) => state.recordResult);

  // Record exactly once per visit (ADR 0017): the ref blocks re-renders and
  // StrictMode's double effect; mergeResult in the store is idempotent anyway,
  // so even a remount with the same params cannot inflate progress.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current || lessonId === '' || total <= 0) {
      return;
    }
    recordedRef.current = true;
    recordResult(lessonId, correct, total);
    if (passed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [lessonId, correct, total, passed, recordResult]);

  const title = badge === 'perfect' ? strings.result.perfectTitle : passed ? strings.result.passTitle : strings.result.failTitle;
  const mascotSpeech =
    badge === 'perfect'
      ? strings.result.mascotPerfect
      : passed
        ? strings.result.mascotPass
        : strings.result.mascotFail;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.celebration}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.score}>{strings.result.score(correct, total)}</Text>
        {badge !== 'none' ? <BadgeReveal badge={badge} /> : null}
        <Mascot size={72} speech={mascotSpeech} />
      </View>
      <View style={styles.actions}>
        {/* Primary action follows the likely next step; retakes keep the best result. */}
        {lessonId !== '' && (
          <ChunkyButton
            label={strings.result.retryLesson}
            icon="🔄"
            variant={passed ? 'sky' : 'primary'}
            onPress={() => router.replace(`/exercise/${lessonId}`)}
          />
        )}
        <ChunkyButton
          label={strings.result.goHome}
          icon="🏠"
          variant={passed ? 'primary' : 'sky'}
          onPress={() => router.replace('/')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  celebration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  score: {
    ...typography.subtitle,
    color: colors.muted,
  },
  actions: {
    gap: spacing.md,
  },
});
