import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import i18n from '../../src/i18n';
import { useLanguageTransitionStore } from '../../src/store/languageTransitionStore';

// Reduced motion decides between "start the overlay transition" and "swap
// instantly"; everything else in reanimated stays real (jest test mode).
let mockReduceMotion = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  // Spread drops the non-enumerable ESM markers; restore them or `Animated`
  // (the default export) resolves to undefined in the components under test.
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useReducedMotion: () => mockReduceMotion,
  };
});

const t = i18n.getFixedT(null, 'common');

describe('LanguageSwitch — flag tiles', () => {
  beforeEach(async () => {
    mockReduceMotion = false;
    useLanguageTransitionStore.setState({ pending: null });
    await i18n.changeLanguage('tr');
  });

  it('shows each language in its own name with radio + selected states', async () => {
    await render(<LanguageSwitch />);

    const trTile = screen.getByRole('radio', { name: t('language.tr') });
    const enTile = screen.getByRole('radio', { name: t('language.en') });
    expect(screen.getByText('Türkçe')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
    expect(trTile.props.accessibilityState).toMatchObject({ checked: true, selected: true });
    expect(enTile.props.accessibilityState).toMatchObject({ checked: false, selected: false });
  });

  it('starts a transition instead of swapping the language itself', async () => {
    await render(<LanguageSwitch />);

    await fireEvent.press(screen.getByRole('radio', { name: t('language.en') }));

    expect(useLanguageTransitionStore.getState().pending).toBe('en');
    // The actual swap belongs to the overlay, mid-transition — not to the tap.
    expect(i18n.language).toBe('tr');
  });

  it('treats a tap on the already-active language as a no-op', async () => {
    await render(<LanguageSwitch />);

    await fireEvent.press(screen.getByRole('radio', { name: t('language.tr') }));

    expect(useLanguageTransitionStore.getState().pending).toBeNull();
    expect(i18n.language).toBe('tr');
  });

  it('ignores taps while a transition is already running', async () => {
    await render(<LanguageSwitch />);
    await act(() => {
      useLanguageTransitionStore.getState().begin('en');
    });

    await fireEvent.press(screen.getByRole('radio', { name: t('language.en') }));
    // The store guard is idempotent even if a call slips past the disabled tile.
    useLanguageTransitionStore.getState().begin('tr');

    expect(useLanguageTransitionStore.getState().pending).toBe('en');
    expect(i18n.language).toBe('tr');
  });

  it('swaps instantly with no overlay under reduced motion', async () => {
    mockReduceMotion = true;
    await render(<LanguageSwitch />);

    await fireEvent.press(screen.getByRole('radio', { name: t('language.en') }));

    expect(i18n.language).toBe('en');
    expect(useLanguageTransitionStore.getState().pending).toBeNull();
  });
});
