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

const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockUsePreventRemove = jest.fn();
let mockVideoProps: { onEnded: () => void; onError: (cause: unknown) => void } | undefined;

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
  ExerciseVideo: (props: { onEnded: () => void; onError: (cause: unknown) => void }) => {
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

  it('unlocks the quiz through the error path and confirms an intercepted back via the sheet', async () => {
    await render(<ExerciseScreen />);

    // Video failure must never block the flow: the CTA unlocks anyway.
    await act(() => {
      mockVideoProps?.onError(new Error('media'));
    });
    await fireEvent.press(screen.getByLabelText(t('startQuiz')));
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

  it('opens the same sheet from the 🏠 button and replaces to Home on confirm', async () => {
    await render(<ExerciseScreen />);

    // Video stage: the exit button is already there.
    await fireEvent.press(screen.getByLabelText(t('exitButton')));
    expect(screen.getByText(t('exitPrompt'), { exact: false })).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(t('exitLeave')));
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockDispatch).not.toHaveBeenCalled(); // no intercepted action to replay
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
