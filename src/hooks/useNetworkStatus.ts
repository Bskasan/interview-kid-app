/**
 * NetInfo hook behind the offline banner and video/watchdog decisions.
 * Reports offline only on a definite negative: NetInfo's initial state can be
 * `null` ("unknown"), which must not flash the offline banner on startup.
 */
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  return { isOffline };
}
