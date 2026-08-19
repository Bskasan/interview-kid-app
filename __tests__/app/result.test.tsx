import { act, fireEvent, render, screen } from '@testing-library/react-native';
import ResultScreen from '../../app/result';
import i18n from '../../src/i18n';
import { useProgressStore } from '../../src/store/progressStore';

const t = i18n.getFixedT(null, 'result');

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
  // useNavigationLock subscribes via useFocusEffect; run it once like a mount.
  useFocusEffect: (callback: () => void) => callback(),
}));

const originalRecordResult = useProgressStore.getState().recordResult;

describe('Result screen — recording and navigation guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { lessonId: '42', correct: '2', total: '3' };
    useProgressStore.setState({ results: {}, recordResult: originalRecordResult });
  });

  it('records the result exactly once even when the effect re-runs', async () => {
    const firstSpy = jest.fn();
    useProgressStore.setState({ recordResult: firstSpy });

    await render(<ResultScreen />);
    expect(firstSpy).toHaveBeenCalledTimes(1);
    expect(firstSpy).toHaveBeenCalledWith('42', 2, 3);

    // Changing the store action re-renders the screen and re-fires the effect
    // with new deps — the once-per-visit ref must still block a second write.
    const secondSpy = jest.fn();
    await act(() => {
      useProgressStore.setState({ recordResult: secondSpy });
    });
    expect(secondSpy).not.toHaveBeenCalled();
    expect(firstSpy).toHaveBeenCalledTimes(1);
  });

  it('records nothing and hides retry when the lesson id is missing', async () => {
    mockParams = { correct: '2', total: '3' };
    const recordSpy = jest.fn();
    useProgressStore.setState({ recordResult: recordSpy });

    await render(<ResultScreen />);

    expect(recordSpy).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(t('retryLesson'))).toBeNull();
    expect(screen.getByLabelText(t('goHome'))).toBeTruthy();
  });

  it('records nothing when the total param is garbage', async () => {
    mockParams = { lessonId: '42', correct: '2', total: 'garbage' };
    const recordSpy = jest.fn();
    useProgressStore.setState({ recordResult: recordSpy });

    await render(<ResultScreen />);

    expect(recordSpy).not.toHaveBeenCalled();
  });

  it('navigates once even when both buttons are tapped in quick succession', async () => {
    await render(<ResultScreen />);

    await fireEvent.press(screen.getByLabelText(t('retryLesson')));
    await fireEvent.press(screen.getByLabelText(t('goHome')));

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/exercise/42');
  });

  it('stores the best result through the real store on a repeat visit', async () => {
    useProgressStore.getState().recordResult('42', 3, 3);

    await render(<ResultScreen />); // arrives with 2/3, worse than stored 3/3

    expect(useProgressStore.getState().results['42']).toEqual({
      best: 3,
      total: 3,
      badge: 'perfect',
    });
  });
});
