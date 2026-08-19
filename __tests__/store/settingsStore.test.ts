import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

describe('settingsStore — persisted language choice', () => {
  afterEach(async () => {
    // Reset to the boot state (device locale is mocked as tr in jest.setup).
    useSettingsStore.setState({ language: null });
    await i18n.changeLanguage('tr');
    await AsyncStorage.clear();
  });

  it('switches the active i18n language immediately on setLanguage', async () => {
    expect(i18n.language).toBe('tr');

    useSettingsStore.getState().setLanguage('en');

    expect(useSettingsStore.getState().language).toBe('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('common:retry')).toBe('Try again');
  });

  it('persists only the language field', async () => {
    useSettingsStore.getState().setLanguage('en');
    // zustand's persist writes asynchronously; flush microtasks.
    await Promise.resolve();

    const raw = await AsyncStorage.getItem('settings-v1');
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!) as { state: Record<string, unknown> };
    expect(persisted.state).toEqual({ language: 'en' });
  });
});
