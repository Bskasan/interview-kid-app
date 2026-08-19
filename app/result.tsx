import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeReveal } from '@/components/BadgeReveal';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { hapticSuccess } from '@/lib/haptics';
import { computeOutcome } from '@/lib/scoring';
import { useProgressStore } from '@/store/progressStore';
import { colors, spacing, typography } from '@/theme';
import { paramNumber, paramString } from '@/utils/routeParams';

export default function ResultScreen() {
  const { t } = useTranslation('result');
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId: string; correct: string; total: string }>();
  const lessonId = paramString(params.lessonId);
  // Params arrive as strings (or garbage on a bad deep link); scoring clamps further.
  const correct = paramNumber(params.correct);
  const total = paramNumber(params.total);

  const { passed, badge } = computeOutcome(correct, total);
  const recordResult = useProgressStore((state) => state.recordResult);

  // Double-tapping a button must not replace twice; the screen unmounts on
  // navigation, so the lock never needs resetting.
  const navigateOnce = useNavigationLock();

  // Record exactly once per visit: the ref blocks re-renders and
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
      hapticSuccess();
    }
  }, [lessonId, correct, total, passed, recordResult]);

  const title = badge === 'perfect' ? t('perfectTitle') : passed ? t('passTitle') : t('failTitle');
  const mascotSpeech =
    badge === 'perfect' ? t('mascotPerfect') : passed ? t('mascotPass') : t('mascotFail');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.celebration}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.score}>{t('score', { correct, total })}</Text>
        {badge !== 'none' ? <BadgeReveal badge={badge} /> : null}
        <Mascot size={72} speech={mascotSpeech} />
      </View>
      <View style={styles.actions}>
        {/* Primary action follows the likely next step; retakes keep the best result. */}
        {lessonId !== '' && (
          <ChunkyButton
            label={t('retryLesson')}
            icon="🔄"
            variant={passed ? 'sky' : 'primary'}
            onPress={() => navigateOnce(() => router.replace(`/exercise/${lessonId}`))}
          />
        )}
        <ChunkyButton
          label={t('goHome')}
          icon="🏠"
          variant={passed ? 'primary' : 'sky'}
          onPress={() => navigateOnce(() => router.replace('/'))}
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
