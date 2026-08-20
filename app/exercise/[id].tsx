/**
 * Exercise screen: a lesson's video stage (explicit loading/ready/ended/error
 * machine) followed by a timed multiple-choice quiz on visual answer tiles.
 * Every exit path routes through one confirm sheet; finishing replaces to Result.
 */
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
import { VideoUnavailableCard } from '@/components/VideoUnavailableCard';
import { LESSON_VIDEO_URL } from '@/constants/media';
import {
  ANSWER_FEEDBACK_MS,
  SECONDS_PER_QUESTION,
  VIDEO_READY_TIMEOUT_MS,
} from '@/constants/timing';
import { getQuestionSet } from '@/data/questions';
import { useCountdown } from '@/hooks/useCountdown';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { handleError } from '@/lib/errors/handleError';
import { hapticSuccess } from '@/lib/haptics';
import {
  advanceQuiz,
  answerQuestion,
  createQuizState,
  feedbackForOption,
  timeoutQuestion,
  type QuizState,
} from '@/lib/quiz';
import { colors, spacing, typography } from '@/theme';
import { paramString } from '@/utils/routeParams';

/**
 * The video step as an explicit machine. `error` is entered from the player's
 * error event, the ready watchdog, or being offline on entry — and leads to
 * the child's choice (retry / continue without video), never a silent skip.
 */
type VideoState = 'loading' | 'ready' | 'ended' | 'error';

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
  const lessonId = paramString(id);

  const questions = useMemo(() => getQuestionSet(lessonId), [lessonId]);
  const { isOffline } = useNetworkStatus();
  const [stage, setStage] = useState<'video' | 'quiz'>('video');
  const [videoState, setVideoState] = useState<VideoState>('loading');
  // Bumping the key remounts ExerciseVideo: useVideoPlayer recreates the
  // player from scratch — the simplest reliable retry in Expo Go.
  const [playerKey, setPlayerKey] = useState(0);
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
      ANSWER_FEEDBACK_MS,
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
      // The 🏠 button has no intercepted action to replay; land where the
      // hardware-back path also ends up — the exercises tab.
      router.replace('/(tabs)/exercises');
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

  // Silent: this screen renders its own failure UI (the unavailable card).
  // An already-ended video never downgrades — the child's unlock is kept.
  const toVideoError = useCallback((cause: unknown) => {
    handleError(cause, { context: 'exercise.video', code: 'MEDIA', severity: 'silent' });
    setVideoState((state) => (state === 'ended' ? state : 'error'));
  }, []);

  const handleVideoReady = useCallback(
    // Functional update: a late readyToPlay must not resurrect an ended or
    // errored video.
    () => setVideoState((state) => (state === 'loading' ? 'ready' : state)),
    [],
  );
  const handleVideoEnded = useCallback(() => setVideoState('ended'), []);

  // Watchdog: still 'loading' after the timeout counts as failed — and while
  // offline (on entry or mid-load) it fires immediately instead of making the
  // child wait out the full window. Paused while the exit sheet is open (a
  // full window restarts on close); re-armed per retry via playerKey.
  useEffect(() => {
    if (stage !== 'video' || videoState !== 'loading' || sheetVisible) {
      return;
    }
    const timer = setTimeout(
      () =>
        toVideoError(
          isOffline
            ? new Error('Device is offline')
            : new Error(`Video not ready within ${VIDEO_READY_TIMEOUT_MS} ms`),
        ),
      isOffline ? 0 : VIDEO_READY_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [stage, videoState, playerKey, sheetVisible, isOffline, toVideoError]);

  const retryVideo = useCallback(() => {
    if (isOffline) {
      // Still offline: stay on the card; log the attempt for observability.
      handleError(new Error('Video retry while offline'), {
        context: 'exercise.video',
        code: 'MEDIA',
        severity: 'silent',
      });
      return;
    }
    setPlayerKey((key) => key + 1);
    setVideoState('loading');
  }, [isOffline]);

  const continueWithoutVideo = useCallback(() => setStage('quiz'), []);

  const handleAnswer = (choiceIndex: number) => {
    if (!question || quiz.answer !== null || quiz.finished) {
      return;
    }
    if (choiceIndex === question.correctIndex) {
      hapticSuccess();
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
    if (videoState === 'error') {
      // The card carries the message and the two choices; no other action
      // competes with them (the quiz CTA only exists on the happy path).
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.topRow}>
            <ExitButton onPress={openExitSheet} />
          </View>
          <VideoUnavailableCard onRetry={retryVideo} onContinue={continueWithoutVideo} />
          {exitSheet}
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topRow}>
          <ExitButton onPress={openExitSheet} />
        </View>
        <ExerciseVideo
          key={playerKey}
          uri={LESSON_VIDEO_URL}
          suspended={sheetVisible}
          onReady={handleVideoReady}
          onEnded={handleVideoEnded}
          onError={toVideoError}
        />
        <View style={styles.videoMascot}>
          <Mascot size={64} speech={videoState === 'ended' ? t('videoDone') : t('watchFirst')} />
        </View>
        <ChunkyButton
          label={t('startQuiz')}
          icon="🎯"
          disabled={videoState !== 'ended'}
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
          <SegmentedProgress
            current={quiz.index + 1}
            total={questions.length}
            outcomes={quiz.outcomes}
          />
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
