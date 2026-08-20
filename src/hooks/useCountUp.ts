/**
 * Animated integer count-up for stat displays: eases 0 → target over a short
 * window via requestAnimationFrame. `animate: false` (reduced motion) renders
 * the target directly; bumping `restartKey` replays the animation (per focus).
 */
import { useEffect, useState } from 'react';

const COUNT_UP_MS = 600;

export function useCountUp(
  target: number,
  { animate, restartKey = 0 }: { animate: boolean; restartKey?: number },
): number {
  // The value is keyed to its restart generation: a stale generation renders
  // as 0 until the first frame lands, so a replay never flashes the old total
  // and the effect body never needs a synchronous setState.
  const [frameState, setFrameState] = useState({ key: restartKey, value: 0 });

  useEffect(() => {
    if (!animate || target <= 0) {
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      // Ease-out cubic: fast start, gentle landing on the final number.
      setFrameState({ key: restartKey, value: Math.round(target * (1 - (1 - progress) ** 3)) });
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate, restartKey]);

  if (!animate) {
    return target;
  }
  return frameState.key === restartKey ? Math.min(frameState.value, target) : 0;
}
