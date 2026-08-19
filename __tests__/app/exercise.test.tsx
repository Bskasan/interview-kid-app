import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
let mockVideoProps: { onEnded: () => void; onError: () => void } | undefined;

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
  ExerciseVideo: (props: { onEnded: () => void; onError: () => void }) => {
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

  it('arms the guard only while a quiz is in progress', async () => {
    await render(<ExerciseScreen />);
    expect(guardEnabled()).toBe(false); // video stage: nothing to lose yet

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

  it('unlocks the quiz through the error path and confirms exit only on the leave button', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await render(<ExerciseScreen />);

    // Video failure must never block the flow: the CTA unlocks anyway.
    await act(() => {
      mockVideoProps?.onError();
    });
    await fireEvent.press(screen.getByLabelText(t('startQuiz')));
    expect(guardEnabled()).toBe(true);

    const action = { type: 'GO_BACK' };
    await act(() => {
      guardCallback()({ data: { action } });
    });

    expect(alertSpy).toHaveBeenCalledWith(t('exitTitle'), t('exitBody'), expect.any(Array));

    const buttons = alertSpy.mock.calls.at(-1)?.[2] ?? [];
    const cancel = buttons.find((button) => button.text === t('exitCancel'));
    const confirm = buttons.find((button) => button.text === t('exitConfirm'));

    cancel?.onPress?.();
    expect(mockDispatch).not.toHaveBeenCalled(); // staying keeps the attempt

    await act(() => {
      confirm?.onPress?.();
    });
    expect(mockDispatch).toHaveBeenCalledWith(action); // leaving discards it
  });
});
