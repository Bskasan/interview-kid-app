import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
// Since SDK 56 expo-router vendors react-navigation; importing the standalone
// @react-navigation/native package is a bundling error (and would use the wrong
// navigation context). This is the supported compatibility entry.
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lessonThumbnailUrl } from '@/api/lessons';
import { AnswerGrid } from '@/components/AnswerGrid';
import { ChunkyButton } from '@/components/ChunkyButton';
import { ExerciseVideo } from '@/components/ExerciseVideo';
import { ExitButton } from '@/components/ExitButton';
import { ExitConfirmSheet } from '@/components/ExitConfirmSheet';
import { Mascot } from '@/components/Mascot';
import { SegmentedProgress } from '@/components/SegmentedProgress';
import { TimerBar } from '@/components/TimerBar';
import { LESSON_VIDEO_URL } from '@/data/media';
import { getQuestionSet, SECONDS_PER_QUESTION } from '@/data/questions';
import { useCountdown } from '@/hooks/useCountdown';
import { handleError } from '@/lib/errors/handleError';
import {
  advanceQuiz,
  answerQuestion,
  createQuizState,
  feedbackForOption,
  timeoutQuestion,
  type QuizState,
} from '@/lib/quiz';
import { colors, spacing, typography } from '@/theme';

/** How long the ✓/✗ feedback stays on screen before auto-advancing. */
const FEEDBACK_MS = 1400;

// The intercepted navigation action, typed via the hook itself so no
// standalone @react-navigation package needs importing (see comment above).
type PreventRemoveEvent = Parameters<Parameters<typeof usePreventRemove>[1]>[0];
type PendingAction = PreventRemoveEvent['data']['action'];

export default function ExerciseScreen() {
  const { t } = useTranslation('exercise');
  const { t: tq } = useTranslation('questions');
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = typeof id === 'string' ? id : '';

  const questions = useMemo(() => getQuestionSet(lessonId), [lessonId]);
  const [stage, setStage] = useState<'video' | 'quiz'>('video');
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>(createQuizState);

  // Exit-to-home flow: the sheet is the single confirmation surface for the 🏠
  // button, the hardware back button and the back gesture. `pendingAction`
  // stashes an intercepted navigation action; `leaving` disarms the guard for
  // the render in which the actual navigation dispatches.
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [leaving, setLeaving] = useState(false);

  const question = questions[quiz.index];
  // The countdown also freezes while the exit sheet is open.
  const timerRunning = stage === 'quiz' && quiz.answer === null && !quiz.finished && !sheetVisible;

  const handleExpire = useCallback(() => {
    setQuiz((state) => timeoutQuestion(state));
  }, []);
  const { remainingSeconds, progress, reset } = useCountdown(SECONDS_PER_QUESTION, {
    running: timerRunning,
    onExpire: handleExpire,
  });

  // Every question starts with a full timer.
  useEffect(() => {
    reset();
  }, [quiz.index, reset]);

  // Let the child see the feedback, then move on (also after a timeout) —
  // never behind the open exit sheet, so nothing changes while they decide.
  useEffect(() => {
    if (quiz.answer === null || quiz.finished || sheetVisible) {
      return;
    }
    const timer = setTimeout(
      () => setQuiz((state) => advanceQuiz(state, questions.length)),
      FEEDBACK_MS,
    );
    return () => clearTimeout(timer);
  }, [quiz.answer, quiz.finished, sheetVisible, questions.length]);

  // Abandoning the exercise (either stage) opens the confirm sheet; the
  // attempt is discarded only on explicit confirmation. Must be declared
  // before the finish effect below so the guard is already off when the
  // replace to /result dispatches. While the sheet itself is open, Android
  // back is intercepted by the Modal (onRequestClose → stay) instead.
  usePreventRemove(!quiz.finished && !leaving, ({ data }) => {
    setPendingAction(data.action);
    setSheetVisible(true);
  });

  // Confirming exit: this effect runs on the render where the guard is
  // already disarmed (`leaving` flipped), so the navigation passes through. A
  // stashed action (hardware back/gesture) is dispatched as intercepted;
  // the 🏠 path replaces straight to Home.
  useEffect(() => {
    if (!leaving) {
      return;
    }
    if (pendingAction) {
      navigation.dispatch(pendingAction);
    } else {
      router.replace('/');
    }
  }, [leaving, pendingAction, navigation, router]);

  // replace (not push): back from Result must not re-enter a finished quiz.
  useEffect(() => {
    if (!quiz.finished) {
      return;
    }
    router.replace({
      pathname: '/result',
      params: { lessonId, correct: String(quiz.correct), total: String(questions.length) },
    });
  }, [quiz.finished, quiz.correct, questions.length, lessonId, router]);

  const openExitSheet = useCallback(() => {
    setPendingAction(null);
    setSheetVisible(true);
  }, []);
  const stayInExercise = useCallback(() => setSheetVisible(false), []);
  const confirmExit = useCallback(() => {
    setSheetVisible(false);
    setLeaving(true);
  }, []);

  const handleVideoEnded = useCallback(() => setVideoEnded(true), []);
  // Silent: this screen renders its own failure UI (mascot line + open CTA).
  const handleVideoError = useCallback((cause: unknown) => {
    handleError(cause, { context: 'exercise.video', code: 'MEDIA', severity: 'silent' });
    setVideoFailed(true);
  }, []);

  const handleAnswer = (choiceIndex: number) => {
    if (!question || quiz.answer !== null || quiz.finished) {
      return;
    }
    if (choiceIndex === question.correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setQuiz((state) => answerQuestion(state, choiceIndex, question.correctIndex));
  };

  const exitSheet = (
    <ExitConfirmSheet
      visible={sheetVisible}
      thumbnailUrl={lessonId ? lessonThumbnailUrl(lessonId) : undefined}
      onStay={stayInExercise}
      onLeave={confirmExit}
    />
  );

  if (stage === 'video') {
    const mascotSpeech = videoFailed
      ? t('videoError')
      : videoEnded
        ? t('videoDone')
        : t('watchFirst');
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topRow}>
          <ExitButton onPress={openExitSheet} />
        </View>
        <ExerciseVideo
          uri={LESSON_VIDEO_URL}
          suspended={sheetVisible}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        />
        <View style={styles.videoMascot}>
          <Mascot size={64} speech={mascotSpeech} />
          {videoFailed ? <Text style={styles.hint}>{t('videoErrorHint')}</Text> : null}
        </View>
        <ChunkyButton
          label={t('startQuiz')}
          icon="🎯"
          disabled={!videoEnded && !videoFailed}
          onPress={() => setStage('quiz')}
        />
        {exitSheet}
      </SafeAreaView>
    );
  }

  if (!question) {
    // Only reachable for a frame while the finish effect replaces the route.
    return <SafeAreaView style={styles.screen} />;
  }

  const mascotSpeech =
    quiz.answer === null
      ? undefined
      : quiz.answer.choice === 'timeout'
        ? t('timeUp')
        : quiz.answer.isCorrect
          ? t('correct')
          : t('wrong');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <ExitButton onPress={openExitSheet} />
        <View style={styles.topRowFill}>
          <SegmentedProgress current={quiz.index + 1} total={questions.length} />
        </View>
      </View>
      <TimerBar progress={progress} remainingSeconds={remainingSeconds} />
      <Text style={styles.prompt} numberOfLines={2}>
        {tq(question.promptKey)}
      </Text>
      <AnswerGrid
        key={quiz.index}
        options={question.options}
        feedbackFor={(index) => feedbackForOption(quiz, index, question.correctIndex)}
        onSelect={handleAnswer}
      />
      <View style={styles.mascotRow}>
        <Mascot size={48} speech={mascotSpeech} />
      </View>
      {exitSheet}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  topRowFill: {
    flex: 1,
  },
  videoMascot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: {
    ...typography.body,
    color: colors.muted,
  },
  prompt: {
    ...typography.subtitle,
    color: colors.ink,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  mascotRow: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
