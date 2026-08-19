import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GlobalErrorBanner } from '../../src/components/GlobalErrorBanner';
import i18n from '../../src/i18n';
import { createAppError } from '../../src/lib/errors/types';
import { useErrorStore } from '../../src/store/errorStore';

const t = i18n.getFixedT(null, 'errors');
const tCommon = i18n.getFixedT(null, 'common');

describe('GlobalErrorBanner — the single error surface', () => {
  beforeEach(() => {
    useErrorStore.setState({ current: null });
  });

  it('renders nothing while there is no error', async () => {
    await render(<GlobalErrorBanner />);
    expect(screen.toJSON()).toBeNull();
  });

  it('shows the translated generic message and dismisses on OK', async () => {
    await render(<GlobalErrorBanner />);
    await act(() => {
      useErrorStore.getState().show(createAppError('NETWORK'));
    });

    expect(await screen.findByText(t('network'))).toBeTruthy();
    // Generic by design: no code, stack, url or library name is rendered.
    expect(screen.queryByText(/NETWORK/)).toBeNull();

    await fireEvent.press(screen.getByText(t('ok')));
    expect(useErrorStore.getState().current).toBeNull();
    expect(screen.queryByText(t('network'))).toBeNull();
  });

  it('offers try-again only when the error carries a retry action', async () => {
    await render(<GlobalErrorBanner />);
    await act(() => {
      useErrorStore.getState().show(createAppError('STORAGE'));
    });
    expect(await screen.findByText(t('storage'))).toBeTruthy();
    expect(screen.queryByText(new RegExp(tCommon('retry')))).toBeNull();

    const retry = jest.fn();
    await act(() => {
      useErrorStore.getState().show(createAppError('NETWORK', { retry }));
    });
    const retryButton = await screen.findByText(new RegExp(tCommon('retry')));

    await fireEvent.press(retryButton);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(useErrorStore.getState().current).toBeNull();
  });
});
