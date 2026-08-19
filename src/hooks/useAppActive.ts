import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** True while the app is foregrounded. Drives timer pause and video pause (ADR 0013). */
export function useAppActive() {
  // Cold start can briefly report 'unknown' (and RN's jest mock isn't a string at
  // all); only an explicit background/inactive counts as "not active", otherwise
  // autoplay and the timer would stick paused with no change event to unstick them.
  const [isActive, setIsActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return isActive;
}
