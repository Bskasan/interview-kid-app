import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import i18n, { isAppLanguage, type AppLanguage } from '@/i18n';

type SettingsState = {
  /** Explicit user choice; null means "follow the device language". */
  language: AppLanguage | null;
  hasHydrated: boolean;
  setLanguage: (language: AppLanguage) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: null,
      hasHydrated: false,
      setLanguage: (language) => {
        set({ language });
        void i18n.changeLanguage(language);
      },
    }),
    {
      name: 'settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      // i18n boots with the device language before hydration finishes; a stored
      // explicit choice wins as soon as it arrives (a sub-second flash of the
      // device language on cold start is accepted — no blank gate for everyone
      // to serve the rare mismatch case).
      onRehydrateStorage: () => (state) => {
        useSettingsStore.setState({ hasHydrated: true });
        const persisted = state?.language;
        if (isAppLanguage(persisted) && persisted !== i18n.language) {
          void i18n.changeLanguage(persisted);
        }
      },
    },
  ),
);
