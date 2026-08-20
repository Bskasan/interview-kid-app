/**
 * Persisted day streak: how many consecutive local calendar days the app was
 * opened. Touched from the root layout on launch and every foreground; the
 * rules live in src/lib/streak.ts.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { handleError } from '@/lib/errors/handleError';
import { nextStreak, type StreakRecord } from '@/lib/streak';
import { reportingStorage } from '@/lib/storage';

type StreakState = StreakRecord & {
  hasHydrated: boolean;
  /** Counts today into the streak; same-day repeats are free no-ops. */
  touchToday: (todayISO: string) => void;
};

export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      lastOpenDate: null,
      count: 0,
      hasHydrated: false,
      touchToday: (todayISO) =>
        set((state) => {
          const prev: StreakRecord = { lastOpenDate: state.lastOpenDate, count: state.count };
          const next = nextStreak(prev, todayISO);
          // Identity contract from nextStreak: same object = nothing changed,
          // so a same-day touch never causes a persist write.
          return next === prev ? {} : next;
        }),
    }),
    {
      name: 'streak-v1',
      storage: createJSONStorage(() => reportingStorage),
      partialize: (state) => ({ lastOpenDate: state.lastOpenDate, count: state.count }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          // A lost streak restarts at 1 tomorrow — log it, don't alarm anyone.
          handleError(error, { context: 'streak.rehydrate', code: 'STORAGE', severity: 'silent' });
        }
        useStreakStore.setState({ hasHydrated: true });
      },
    },
  ),
);
