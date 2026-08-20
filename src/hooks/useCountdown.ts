/**
 * Question countdown hook: timestamp-based remaining time with pause/resume on
 * answer feedback and app backgrounding, single-fire expiry, and a reset for
 * the next question.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { COUNTDOWN_TICK_MS } from '@/constants/timing';
import { useAppActive } from '@/hooks/useAppActive';

type Options = {
  /** The countdown only consumes time while true (and the app is foregrounded). */
  running: boolean;
  /** Called exactly once when the countdown reaches zero (until reset()). */
  onExpire: () => void;
};

/**
 * Question countdown. Timestamp-based: while active, remaining time is
 * recomputed from Date.now() against a deadline, so JS-thread congestion cannot make
 * the timer run slow; ticks only refresh the display. Pausing (answer feedback,
 * app backgrounded via AppState) snapshots the remaining time; resuming sets a new
 * deadline from that snapshot — backgrounded time is never counted.
 */
export function useCountdown(totalSeconds: number, { running, onExpire }: Options) {
  const totalMs = totalSeconds * 1000;
  const appActive = useAppActive();
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const remainingRef = useRef(totalMs);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const active = running && appActive && remainingMs > 0;

  useEffect(() => {
    if (!active) {
      return;
    }
    const deadline = Date.now() + remainingRef.current;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      remainingRef.current = left;
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(intervalId);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
        }
      }
    };
    const intervalId = setInterval(tick, COUNTDOWN_TICK_MS);
    return () => {
      clearInterval(intervalId);
      // Snapshot the pause point so a resume continues where it stopped.
      const left = Math.max(0, deadline - Date.now());
      remainingRef.current = left;
      setRemainingMs(left);
    };
  }, [active]);

  const reset = useCallback(() => {
    remainingRef.current = totalMs;
    expiredRef.current = false;
    setRemainingMs(totalMs);
  }, [totalMs]);

  return {
    /** Whole seconds left, rounded up (15 → … → 1 → 0). */
    remainingSeconds: Math.ceil(remainingMs / 1000),
    /** 1 → 0 as time runs out; drives the shrinking bar. */
    progress: totalMs === 0 ? 0 : remainingMs / totalMs,
    reset,
  };
}
