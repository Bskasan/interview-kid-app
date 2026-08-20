/**
 * Gentle "you are here" pulse: loops a shared value 1 → target → 1 while
 * active, parking at 1 otherwise and under reduced motion. Callers map the
 * value onto their own property (scale, opacity) in an animated style.
 */
import { useEffect } from 'react';
import {
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PULSE_PHASE_MS = 600;

export function usePulse(active: boolean, target: number) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const running = active && !reduceMotion;

  useEffect(() => {
    if (running) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(target, { duration: PULSE_PHASE_MS }),
          withTiming(1, { duration: PULSE_PHASE_MS }),
        ),
        -1,
      );
      return () => cancelAnimation(pulse);
    }
    pulse.value = 1;
    return undefined;
  }, [running, target, pulse]);

  return pulse;
}
