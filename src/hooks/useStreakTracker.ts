/**
 * Feeds app-opens into the streak store: fires on launch and on every
 * return to foreground, once storage has rehydrated. Mounted at the root so a
 * midnight-crossing foreground counts on any screen, not just the dashboard.
 */
import { useEffect } from 'react';
import { useAppActive } from '@/hooks/useAppActive';
import { localTodayISO } from '@/lib/streak';
import { useStreakStore } from '@/store/streakStore';

export function useStreakTracker() {
  const appActive = useAppActive();
  const hasHydrated = useStreakStore((state) => state.hasHydrated);

  useEffect(() => {
    if (appActive && hasHydrated) {
      // Same-day repeats are no-ops in the store, so firing often is free.
      useStreakStore.getState().touchToday(localTodayISO());
    }
  }, [appActive, hasHydrated]);
}
