import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '@/lib/errors/handleError';

/**
 * AsyncStorage wrapper used by every persistence consumer (zustand stores, the
 * React Query persister) so storage failures are reported instead of vanishing.
 * Failure policy: reads degrade to "no data" silently (the UI's neutral empty
 * states are correct and a banner at boot would only scare); writes notify —
 * the child's new badge may not survive a restart, which is worth one calm
 * message.
 */
export const reportingStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (cause) {
      handleError(cause, { context: `storage.get.${key}`, code: 'STORAGE', severity: 'silent' });
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (cause) {
      handleError(cause, { context: `storage.set.${key}`, code: 'STORAGE', severity: 'notify' });
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (cause) {
      handleError(cause, { context: `storage.remove.${key}`, code: 'STORAGE', severity: 'silent' });
    }
  },
};
