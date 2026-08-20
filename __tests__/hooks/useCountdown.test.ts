import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useCountdown } from '../../src/hooks/useCountdown';

describe('useCountdown — per-question countdown timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const setup = async (seconds = 15) => {
    const onExpire = jest.fn();
    const utils = await renderHook(
      ({ run }: { run: boolean }) => useCountdown(seconds, { running: run, onExpire }),
      { initialProps: { run: true } },
    );
    return { onExpire, ...utils };
  };

  it('ticks the remaining seconds down while running', async () => {
    const { result } = await setup();
    expect(result.current.remainingSeconds).toBe(15);

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.remainingSeconds).toBe(12);
    expect(result.current.progress).toBeCloseTo(12 / 15, 2);
  });

  it('pauses when running turns false and resumes from the same point', async () => {
    const { result, rerender } = await setup();
    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    await rerender({ run: false });
    await act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.remainingSeconds).toBe(10);

    await rerender({ run: true });
    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(8);
  });

  it('fires onExpire exactly once when the time runs out', async () => {
    const { result, onExpire } = await setup(2);
    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  // One instance = one question: the next question's fresh clock comes from a
  // keyed remount, so a new instance must be fully independent of an expired one.
  it('a fresh instance after remount starts full and expires exactly once again', async () => {
    const onExpire = jest.fn();
    const first = await renderHook(() => useCountdown(2, { running: true, onExpire }));
    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    await first.unmount();

    const second = await renderHook(() => useCountdown(2, { running: true, onExpire }));
    expect(second.result.current.remainingSeconds).toBe(2);
    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onExpire).toHaveBeenCalledTimes(2);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('never ticks or expires while running is false from the start', async () => {
    const onExpire = jest.fn();
    const { result } = await renderHook(() => useCountdown(15, { running: false, onExpire }));

    await act(() => {
      jest.advanceTimersByTime(20_000);
    });

    expect(result.current.remainingSeconds).toBe(15);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('clears its interval on unmount and never expires afterwards', async () => {
    const { onExpire, unmount } = await setup(2);

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    await unmount();

    // No act: the tree is gone; a surviving interval would still fire the spy.
    jest.advanceTimersByTime(5000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('pauses while the app is backgrounded and resumes on foreground', async () => {
    let appStateHandler: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      appStateHandler = handler as (state: AppStateStatus) => void;
      return { remove: jest.fn() } as never;
    });

    const { result } = await setup();
    await act(() => {
      jest.advanceTimersByTime(5000);
    });

    await act(() => {
      appStateHandler?.('background');
    });
    await act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.remainingSeconds).toBe(10);

    await act(() => {
      appStateHandler?.('active');
    });
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(9);
  });
});
