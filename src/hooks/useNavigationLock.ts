/**
 * One-shot navigation lock: the returned function runs its navigation at most
 * once, so a fast double-tap can never push or replace twice. With
 * `resetOnFocus` the lock re-opens when the screen regains focus (the
 * exercises map: coming back must allow the next tap); without it the lock is
 * permanent for the mount (Result: the screen is replaced away and never
 * returns).
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

export function useNavigationLock({ resetOnFocus = false }: { resetOnFocus?: boolean } = {}) {
  const lockRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (resetOnFocus) {
        lockRef.current = false;
      }
    }, [resetOnFocus]),
  );

  return useCallback((navigate: () => void) => {
    if (lockRef.current) {
      return;
    }
    lockRef.current = true;
    navigate();
  }, []);
}
