/**
 * Persisted per-lesson progress: the best completed attempt for each lesson,
 * written idempotently from the Result screen and read by Home's cards.
 * Survives restarts via AsyncStorage.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { handleError } from '@/lib/errors/handleError';
import { mergeResult } from '@/lib/scoring';
import { reportingStorage } from '@/lib/storage';
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
      storage: createJSONStorage(() => reportingStorage),
      partialize: (state) => ({ results: state.results }),
      // The error argument covers what the storage wrapper can't see: corrupt
      // JSON that fails to parse during rehydration. The child would silently
      // see all badges gone — worth one calm banner.
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          handleError(error, { context: 'progress.rehydrate', code: 'STORAGE' });
        }
        useProgressStore.setState({ hasHydrated: true });
      },
    },
  ),
);
