import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

// On native, React Query cannot see connectivity by itself; NetInfo drives its
// online state so stale queries refetch automatically on reconnect.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // gcTime must outlive the persister's maxAge, or restored queries are
      // garbage-collected right after hydration.
      gcTime: DAY_MS,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage });

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: DAY_MS, buster: 'lessons-v1' }}
      >
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
