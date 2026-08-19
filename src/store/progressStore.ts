import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mergeResult } from '@/lib/scoring';
import type { LessonResult } from '@/types/progress';

type ProgressState = {
  /** Best completed attempt per lesson id. Abandoned attempts are never recorded. */
  results: Record<string, LessonResult>;
  /**
   * AsyncStorage rehydration is async: until this flips, `results` is empty even
   * for a returning user. Readers show the neutral "no progress" visuals meanwhile.
   */
  hasHydrated: boolean;
  recordResult: (lessonId: string, correct: number, total: number) => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      results: {},
      hasHydrated: false,
      recordResult: (lessonId, correct, total) =>
        set((state) => ({
          results: {
            ...state.results,
            [lessonId]: mergeResult(state.results[lessonId], correct, total),
          },
        })),
    }),
    {
      name: 'progress-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ results: state.results }),
      onRehydrateStorage: () => () => {
        useProgressStore.setState({ hasHydrated: true });
      },
    },
  ),
);
