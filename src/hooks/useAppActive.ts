import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** True while the app is foregrounded. Drives timer pause and video pause (ADR 0013). */
export function useAppActive() {
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return isActive;
}
