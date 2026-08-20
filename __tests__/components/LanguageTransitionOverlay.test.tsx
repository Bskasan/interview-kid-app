import { act, render, screen } from '@testing-library/react-native';
import { LanguageTransitionOverlay } from '../../src/components/LanguageTransitionOverlay';
import { LANGUAGE_TRANSITION } from '../../src/constants/timing';
import i18n from '../../src/i18n';
import { useLanguageTransitionStore } from '../../src/store/languageTransitionStore';

const tEn = i18n.getFixedT('en', 'common');

// The sequence is driven by plain JS timers, so fake timers make every step
// (swap under full opacity, unmount at the end) directly assertable.
describe('LanguageTransitionOverlay — timed sequence', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.useFakeTimers();
    useLanguageTransitionStore.setState({ pending: null });
  });

  // Repo convention (exercise.test.tsx): abandon pending fake timers rather
  // than flushing them — a teardown flush strands React scheduler tasks in the
  // fake clock and wedges every later render in the file.
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing while idle', async () => {
    await render(<LanguageTransitionOverlay />);
    expect(screen.toJSON()).toBeNull();
  });

  it('shows the line in the TARGET language before the app flips', async () => {
    await render(<LanguageTransitionOverlay />);

    await act(() => {
      useLanguageTransitionStore.getState().begin('en');
    });

    expect(screen.getByText(tEn('languageChanging'))).toBeTruthy();
    expect(i18n.language).toBe('tr');
  });

  it('swaps under full opacity, then unmounts and clears the pending state', async () => {
    await render(<LanguageTransitionOverlay />);
    await act(() => {
      useLanguageTransitionStore.getState().begin('en');
    });

    await act(() => {
      jest.advanceTimersByTime(LANGUAGE_TRANSITION.swapAtMs);
    });
    // The language flipped while the overlay is still covering the app.
    expect(i18n.language).toBe('en');
    expect(screen.getByText(tEn('languageChanging'))).toBeTruthy();

    await act(() => {
      jest.advanceTimersByTime(LANGUAGE_TRANSITION.totalMs - LANGUAGE_TRANSITION.swapAtMs);
    });
    expect(useLanguageTransitionStore.getState().pending).toBeNull();
    expect(screen.toJSON()).toBeNull();
    expect(i18n.language).toBe('en');
  });
});
