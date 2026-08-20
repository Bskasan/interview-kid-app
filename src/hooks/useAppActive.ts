/**
 * AppState hook: true while the app is foregrounded. Drives the quiz timer
 * pause and the video pause when the child switches away.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useAppActive() {
  // Cold start can briefly report 'unknown' (and RN's jest mock isn't a string at
  // all); only an explicit background/inactive counts as "not active", otherwise
  // autoplay and the timer would stick paused with no change event to unstick them.
  const [isActive, setIsActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return isActive;
}
