/**
 * Persisted per-lesson progress: the best completed attempt for each lesson,
 * written idempotently from the Result screen, read by the map (stars +
 * unlocking) and the dashboard. Versioned persistence with a normalizing
 * migration; survives restarts via AsyncStorage.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { handleError } from '@/lib/errors/handleError';
import { computeOutcome, mergeResult, safeScore } from '@/lib/scoring';
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

type PersistedProgress = { results: Record<string, LessonResult> };

/**
 * Pre-hydration stand-in for `results`. A stable reference: returning a fresh
 * `{}` from a selector would make every store update look like a change.
 */
export const EMPTY_RESULTS: Record<string, LessonResult> = {};

/** Current persisted-schema version (see migrateProgress). */
export const PROGRESS_VERSION = 1;

/**
 * v0 → v1: same shape, but v0 was written without any validation of what came
 * back OUT of storage. The migration normalizes legacy records — drops
 * non-object entries, clamps `best` into range, recomputes an inconsistent
 * badge — so the unlock chain can trust every stored star count. Exported for
 * direct unit testing (zustand gives no handle on the configured migrate).
 */
export function migrateProgress(persisted: unknown, fromVersion: number): PersistedProgress {
  if (fromVersion >= PROGRESS_VERSION) {
    return persisted as PersistedProgress;
  }
  const raw = (persisted as { results?: unknown } | null)?.results;
  const results: Record<string, LessonResult> = {};
  if (raw && typeof raw === 'object') {
    for (const [lessonId, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value !== 'object' || value === null) {
        continue;
      }
      const record = value as { best?: unknown; total?: unknown };
      const total = typeof record.total === 'number' ? Math.trunc(record.total) : NaN;
      const best = safeScore(typeof record.best === 'number' ? record.best : 0, total);
      if (best === null) {
        continue;
      }
      results[lessonId] = { best, total, badge: computeOutcome(best, total).badge };
    }
  }
  return { results };
}

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
      // The key survives the version bump on purpose: renaming it would
      // silently discard a child's earned progress.
      name: 'progress-v1',
      version: PROGRESS_VERSION,
      migrate: migrateProgress,
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
