import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
// Since SDK 56 expo-router vendors react-navigation; importing the standalone
// @react-navigation/native package is a bundling error (and would use the wrong
// navigation context). This is the supported compatibility entry (ADR 0014).
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnswerOption } from '@/components/AnswerOption';
import { ChunkyButton } from '@/components/ChunkyButton';
import { ExerciseVideo } from '@/components/ExerciseVideo';
import { Mascot } from '@/components/Mascot';
import { SegmentedProgress } from '@/components/SegmentedProgress';
import { TimerBar } from '@/components/TimerBar';
import { LESSON_VIDEO_URL } from '@/data/media';
import { getQuestionSet, optionA11yLabel, SECONDS_PER_QUESTION } from '@/data/questions';
import { useCountdown } from '@/hooks/useCountdown';
import {
  advanceQuiz,
  answerQuestion,
  createQuizState,
  feedbackForOption,
  timeoutQuestion,
  type QuizState,
} from '@/lib/quiz';
import { strings } from '@/lib/strings';
import { colors, spacing, typography } from '@/theme';

/** How long the ✓/✗ feedback stays on screen before auto-advancing. */
const FEEDBACK_MS = 1400;

export default function ExerciseScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = typeof id === 'string' ? id : '';

  const questions = useMemo(() => getQuestionSet(lessonId), [lessonId]);
  const [stage, setStage] = useState<'video' | 'quiz'>('video');
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>(createQuizState);

  const question = questions[quiz.index];
  const timerRunning = stage === 'quiz' && quiz.answer === null && !quiz.finished;

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

  // Let the child see the feedback, then move on (also after a timeout).
  useEffect(() => {
    if (quiz.answer === null || quiz.finished) {
      return;
    }
    const timer = setTimeout(
      () => setQuiz((state) => advanceQuiz(state, questions.length)),
      FEEDBACK_MS
    );
    return () => clearTimeout(timer);
  }, [quiz.answer, quiz.finished, questions.length]);

  // Abandoning a running quiz needs a confirmation; the attempt is discarded
  // (assumption #4). Must be declared before the finish effect below so the
  // guard is already off when the replace to /result dispatches (ADR 0014).
  usePreventRemove(stage === 'quiz' && !quiz.finished, ({ data }) => {
    Alert.alert(strings.exercise.exitTitle, strings.exercise.exitBody, [
      { text: strings.exercise.exitCancel, style: 'cancel' },
      {
        text: strings.exercise.exitConfirm,
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

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

  const handleVideoEnded = useCallback(() => setVideoEnded(true), []);
  const handleVideoError = useCallback(() => setVideoFailed(true), []);

  const handleAnswer = (choiceIndex: number) => {
    if (!question || quiz.answer !== null || quiz.finished) {
      return;
    }
    if (choiceIndex === question.correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setQuiz((state) => answerQuestion(state, choiceIndex, question.correctIndex));
  };

  if (stage === 'video') {
    const mascotSpeech = videoFailed
      ? strings.exercise.videoError
      : videoEnded
        ? strings.exercise.videoDone
        : strings.exercise.watchFirst;
    return (
      <SafeAreaView style={styles.screen}>
        <ExerciseVideo uri={LESSON_VIDEO_URL} onEnded={handleVideoEnded} onError={handleVideoError} />
        <View style={styles.videoMascot}>
          <Mascot size={64} speech={mascotSpeech} />
          {videoFailed ? <Text style={styles.hint}>{strings.exercise.videoErrorHint}</Text> : null}
        </View>
        <ChunkyButton
          label={strings.exercise.startQuiz}
          icon="🎯"
          disabled={!videoEnded && !videoFailed}
          onPress={() => setStage('quiz')}
        />
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
        ? strings.exercise.timeUp
        : quiz.answer.isCorrect
          ? strings.exercise.correct
          : strings.exercise.wrong;

  return (
    <SafeAreaView style={styles.screen}>
      <SegmentedProgress current={quiz.index + 1} total={questions.length} />
      <TimerBar progress={progress} remainingSeconds={remainingSeconds} />
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.options}>
        {question.options.map((option, index) => (
          <AnswerOption
            key={`${quiz.index}-${index}`}
            label={optionA11yLabel(option)}
            feedback={feedbackForOption(quiz, index, question.correctIndex)}
            onPress={() => handleAnswer(index)}
          />
        ))}
      </View>
      <View style={styles.mascotRow}>
        <Mascot size={48} speech={mascotSpeech} />
      </View>
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
  options: {
    gap: spacing.md,
  },
  mascotRow: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
