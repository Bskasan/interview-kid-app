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

describe('LanguageSwitch — single flag-knob toggle', () => {
  beforeEach(async () => {
    mockReduceMotion = false;
    useLanguageTransitionStore.setState({ pending: null });
    await i18n.changeLanguage('tr');
  });

  it('is one button announcing the current language and the switch action', async () => {
    await render(<LanguageSwitch />);

    const toggle = screen.getByRole('button', { name: t('languageToggleA11y.tr') });
    expect(toggle.props.accessibilityState).toMatchObject({ disabled: false, busy: false });
    // Fixed code labels sit at both ends of the track.
    expect(screen.getByText('TR')).toBeTruthy();
    expect(screen.getByText('EN')).toBeTruthy();
  });

  it('starts a transition to the other language instead of swapping itself', async () => {
    await render(<LanguageSwitch />);

    await fireEvent.press(screen.getByRole('button', { name: t('languageToggleA11y.tr') }));

    expect(useLanguageTransitionStore.getState().pending).toBe('en');
    // The actual swap belongs to the overlay, mid-transition — not to the tap.
    expect(i18n.language).toBe('tr');
  });

  it('toggles once on a rapid double-tap', async () => {
    await render(<LanguageSwitch />);
    const toggle = screen.getByRole('button', { name: t('languageToggleA11y.tr') });

    await fireEvent.press(toggle);
    await fireEvent.press(toggle);

    // A second toggle would bounce back toward Turkish; pending must still be
    // the single forward switch.
    expect(useLanguageTransitionStore.getState().pending).toBe('en');
    expect(i18n.language).toBe('tr');
  });

  it('is disabled while a transition is already running', async () => {
    await render(<LanguageSwitch />);
    await act(() => {
      useLanguageTransitionStore.getState().begin('en');
    });

    // With pending set, the control shows the target language and goes inert.
    const toggle = screen.getByRole('button', { name: t('languageToggleA11y.en') });
    expect(toggle.props.accessibilityState).toMatchObject({ disabled: true, busy: true });

    await fireEvent.press(toggle);
    // The store guard is idempotent even if a call slips past the disabled state.
    useLanguageTransitionStore.getState().begin('tr');

    expect(useLanguageTransitionStore.getState().pending).toBe('en');
    expect(i18n.language).toBe('tr');
  });

  it('swaps instantly with no overlay under reduced motion', async () => {
    mockReduceMotion = true;
    await render(<LanguageSwitch />);

    await fireEvent.press(screen.getByRole('button', { name: t('languageToggleA11y.tr') }));

    expect(i18n.language).toBe('en');
    expect(useLanguageTransitionStore.getState().pending).toBeNull();
  });
});
