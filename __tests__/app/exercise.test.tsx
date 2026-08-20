import { act, fireEvent, render, screen } from '@testing-library/react-native';
import ExerciseScreen from '../../app/exercise/[id]';
import { getQuestionSet, optionA11yLabel } from '../../src/data/questions';
import i18n from '../../src/i18n';

const LESSON_ID = 'lesson-1';
const FEEDBACK_MS = 1400;

// The setup file initializes i18n with Turkish; assertions go through t so the
// tests survive copy edits without hardcoding strings.
const t = i18n.getFixedT(null, 'exercise');
const tq = i18n.getFixedT(null, 'questions');
const tCommon = i18n.getFixedT(null, 'common');

const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockUsePreventRemove = jest.fn();
type VideoProps = {
  onReady: () => void;
  onEnded: () => void;
  onError: (cause: unknown) => void;
};
let mockVideoProps: VideoProps | undefined;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: LESSON_ID }),
  useRouter: () => ({ replace: mockReplace }),
  useNavigation: () => ({ dispatch: mockDispatch }),
}));

jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (enabled: boolean, callback: unknown) =>
    mockUsePreventRemove(enabled, callback),
}));

// The video stage is native (expo-video); the screen only needs its callbacks.
jest.mock('@/components/ExerciseVideo', () => ({
  ExerciseVideo: (props: VideoProps) => {
    mockVideoProps = props;
    return null;
  },
}));

const guardEnabled = () => mockUsePreventRemove.mock.calls.at(-1)?.[0] as boolean;
type GuardEvent = { data: { action: { type: string } } };
const guardCallback = () =>
  mockUsePreventRemove.mock.calls.at(-1)?.[1] as (event: GuardEvent) => void;

const startQuiz = async () => {
  await act(() => {
    mockVideoProps?.onEnded();
  });
  await fireEvent.press(screen.getByLabelText(t('startQuiz')));
};

describe('Exercise screen — back guard lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVideoProps = undefined;
    // The video-error path logs through the central handler; keep output clean.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('arms the guard on both stages and drops it on finish', async () => {
    await render(<ExerciseScreen />);
    expect(guardEnabled()).toBe(true); // video stage: same confirm as the 🏠 button

    await startQuiz();
    expect(guardEnabled()).toBe(true);

    // Answer all questions correctly; each answer auto-advances after 1.4 s.
    const questions = getQuestionSet(LESSON_ID);
    for (const question of questions) {
      await fireEvent.press(
        screen.getByLabelText(optionA11yLabel(question.options[question.correctIndex], tq)),
      );
      await act(() => {
        jest.advanceTimersByTime(FEEDBACK_MS);
      });
    }

    // Finishing must drop the guard before the replace to Result dispatches.
    expect(guardEnabled()).toBe(false);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/result',
      params: { lessonId: LESSON_ID, correct: '3', total: '3' },
    });
  });

  it('lets the child continue without the video and confirms an intercepted back via the sheet', async () => {
    await render(<ExerciseScreen />);

    // Video failure: the card replaces the video area, the quiz CTA is gone,
    // and the child decides — here, continue without the video.
    await act(() => {
      mockVideoProps?.onError(new Error('media'));
    });
    expect(screen.getByText(t('videoUnavailable'), { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(t('startQuiz'))).toBeNull();
    await fireEvent.press(screen.getByLabelText(t('videoSkip')));
    expect(guardEnabled()).toBe(true);

    const action = { type: 'GO_BACK' };
    await act(() => {
      guardCallback()({ data: { action } });
    });
    expect(screen.getByText(t('exitPrompt'), { exact: false })).toBeTruthy();

    // Staying closes the sheet, keeps the attempt and re-arms nothing.
    await fireEvent.press(screen.getByLabelText(t('exitStay')));
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(screen.queryByText(t('exitPrompt'), { exact: false })).toBeNull();
    expect(guardEnabled()).toBe(true);

    // Leaving dispatches the intercepted action (guard disarmed via `leaving`).
    await act(() => {
      guardCallback()({ data: { action } });
    });
    await fireEvent.press(screen.getByLabelText(t('exitLeave')));
    expect(mockDispatch).toHaveBeenCalledWith(action);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('opens the same sheet from the 🏠 button and replaces to the exercises tab on confirm', async () => {
    await render(<ExerciseScreen />);

    // Video stage: the exit button is already there.
    await fireEvent.press(screen.getByLabelText(t('exitButton')));
    expect(screen.getByText(t('exitPrompt'), { exact: false })).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(t('exitLeave')));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/exercises');
    expect(mockDispatch).not.toHaveBeenCalled(); // no intercepted action to replay
  });

  it('fails a silent stall via the 12 s watchdog and recovers through retry', async () => {
    await render(<ExerciseScreen />);
    expect(screen.queryByText(t('videoUnavailable'), { exact: false })).toBeNull();

    // No ready/error event arrives: the watchdog turns the stall into the card.
    await act(() => {
      jest.advanceTimersByTime(12_000);
    });
    expect(screen.getByText(t('videoUnavailable'), { exact: false })).toBeTruthy();

    // Retry (online in tests): the player remounts and the happy path resumes.
    await fireEvent.press(screen.getByLabelText(tCommon('retry')));
    expect(screen.queryByText(t('videoUnavailable'), { exact: false })).toBeNull();
    expect(screen.getByText(t('watchFirst'), { exact: false })).toBeTruthy();

    await act(() => {
      mockVideoProps?.onReady();
      mockVideoProps?.onEnded();
    });
    await fireEvent.press(screen.getByLabelText(t('startQuiz')));
    expect(screen.getAllByText(t('question', { current: 1, total: 3 })).length).toBeGreaterThan(0);
  });

  it('keeps a ready video failing the watchdog off the error card', async () => {
    await render(<ExerciseScreen />);

    // readyToPlay arrives in time: the watchdog is disarmed for good.
    await act(() => {
      mockVideoProps?.onReady();
    });
    await act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(screen.queryByText(t('videoUnavailable'), { exact: false })).toBeNull();
    // The CTA stays locked until the video actually ends (happy path intact).
    expect(screen.getByLabelText(t('startQuiz'))).toBeTruthy();
  });

  it('freezes the feedback auto-advance while the sheet is open', async () => {
    await render(<ExerciseScreen />);
    await startQuiz();

    const questions = getQuestionSet(LESSON_ID);
    const first = questions[0]!;
    await fireEvent.press(
      screen.getByLabelText(optionA11yLabel(first.options[first.correctIndex], tq)),
    );

    // Open the sheet during the feedback window: the advance must wait.
    await fireEvent.press(screen.getByLabelText(t('exitButton')));
    await act(() => {
      jest.advanceTimersByTime(FEEDBACK_MS * 2);
    });
    expect(screen.getAllByText(t('question', { current: 1, total: 3 })).length).toBeGreaterThan(0);

    // Staying resumes: the advance fires after a fresh feedback window.
    await fireEvent.press(screen.getByLabelText(t('exitStay')));
    await act(() => {
      jest.advanceTimersByTime(FEEDBACK_MS);
    });
    expect(screen.getAllByText(t('question', { current: 2, total: 3 })).length).toBeGreaterThan(0);
  });
});

describe('Exercise screen — per-question countdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVideoProps = undefined;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const timeLeft = (count: number) => t('timeLeft', { count });
  const answerFirstCorrectly = async () => {
    const first = getQuestionSet(LESSON_ID)[0]!;
    await fireEvent.press(
      screen.getByLabelText(optionA11yLabel(first.options[first.correctIndex], tq)),
    );
  };

  // The suite silences console.error for the intentional video-error logs,
  // which also hides React warnings — so React's duplicate-sibling-key error
  // (timer and grid both keyed by the question index) is asserted explicitly.
  it('renders the quiz without duplicate sibling-key warnings', async () => {
    await render(<ExerciseScreen />);
    await startQuiz();
    await answerFirstCorrectly();
    await act(() => {
      jest.advanceTimersByTime(FEEDBACK_MS);
    });

    // eslint-disable-next-line no-console
    const keyWarnings = (console.error as jest.Mock).mock.calls.filter(
      ([message]) => typeof message === 'string' && message.includes('same key'),
    );
    expect(keyWarnings).toEqual([]);
  });

  it('starts the next question with the full time after an in-time answer', async () => {
    await render(<ExerciseScreen />);
    await startQuiz();

    await act(() => {
      jest.advanceTimersByTime(7000);
    });
    expect(screen.getByLabelText(timeLeft(8))).toBeTruthy();

    await answerFirstCorrectly();
    await act(() => {
      jest.advanceTimersByTime(FEEDBACK_MS);
    });
    expect(screen.getAllByText(t('question', { current: 2, total: 3 })).length).toBeGreaterThan(0);

    // Load-bearing extra second: right after the advance even a broken reset
    // shows 15 for one frame — the carry-over only surfaces on the next tick.
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText(timeLeft(14))).toBeTruthy();
  });

  it('starts the next question with the full time after a timeout', async () => {
    await render(<ExerciseScreen />);
    await startQuiz();

    await act(() => {
      jest.advanceTimersByTime(15_000);
    });
    expect(screen.getByText(t('timeUp'), { exact: false })).toBeTruthy();

    await act(() => {
      jest.advanceTimersByTime(FEEDBACK_MS);
    });
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    // Still question 2 (one timeout advanced exactly one question), fresh clock.
    expect(screen.getAllByText(t('question', { current: 2, total: 3 })).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(timeLeft(14))).toBeTruthy();
  });

  it('keeps the remaining time across an exit-sheet pause — pause is not reset', async () => {
    await render(<ExerciseScreen />);
    await startQuiz();

    await act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByLabelText(timeLeft(10))).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(t('exitButton')));
    await act(() => {
      jest.advanceTimersByTime(60_000);
    });
    // Frozen underneath the sheet: same question, same clock, no timeout.
    expect(screen.getAllByText(t('question', { current: 1, total: 3 })).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(timeLeft(10))).toBeTruthy();
    expect(screen.queryByText(t('timeUp'), { exact: false })).toBeNull();

    await fireEvent.press(screen.getByLabelText(t('exitStay')));
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText(timeLeft(9))).toBeTruthy();
  });
});
