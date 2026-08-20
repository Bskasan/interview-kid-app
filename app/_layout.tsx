/**
 * Root layout: global providers (safe area, React Query persisted to
 * AsyncStorage, i18n side-effect init), the navigation Stack (welcome → tab
 * shell, with exercise/result as full-screen routes), the error-banner and
 * language-transition overlays, the streak tracker, and the kid-friendly
 * root error boundary.
 */
// Side-effect import: initializes i18next synchronously before any screen
// (or the module-scope wiring below) can render user-facing text.
import { ChunkyButton } from '@/components/ChunkyButton';
import { GlobalErrorBanner } from '@/components/GlobalErrorBanner';
import { LanguageTransitionOverlay } from '@/components/LanguageTransitionOverlay';
import { Mascot } from '@/components/Mascot';
import { useStreakTracker } from '@/hooks/useStreakTracker';
import '@/i18n';
import { FALLBACK_ERROR_TEXT, FALLBACK_OK_TEXT } from '@/lib/errors/fallbackText';
import { handleError } from '@/lib/errors/handleError';
import { reportingStorage } from '@/lib/storage';
import { colors, spacing } from '@/theme';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, QueryCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { router, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const LESSONS_STALE_MS = 5 * 60 * 1000;

// On native, React Query cannot see connectivity by itself; NetInfo drives its
// online state so stale queries refetch automatically on reconnect.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

const queryClient = new QueryClient({
  // Central observation point for every query failure. Silent: Home already
  // renders the failure state (or keeps cached data on a background refetch),
  // so the banner would say the same thing twice.
  queryCache: new QueryCache({
    onError: (error) =>
      handleError(error, { context: 'query.lessons', code: 'NETWORK', severity: 'silent' }),
  }),
  defaultOptions: {
    queries: {
      staleTime: LESSONS_STALE_MS,
      // gcTime must outlive the persister's maxAge, or restored queries are
      // garbage-collected right after hydration.
      gcTime: DAY_MS,
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({ storage: reportingStorage });

// Hook carrier: the streak must count opens on any screen (launch and every
// foreground), so it lives beside the overlays, not inside a tab.
function StreakTracker() {
  useStreakTracker();
  return null;
}

/**
 * Expo Router's root error boundary: any uncaught render/effect throw lands
 * here instead of a red screen. Kid-friendly full-screen fallback; the error
 * itself goes through the same central funnel as everything else (silent —
 * this screen IS the surfacing).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t, i18n } = useTranslation(['common', 'result']);

  useEffect(() => {
    handleError(error, { context: 'error-boundary', severity: 'silent' });
  }, [error]);

  const ready = i18n.isInitialized;
  return (
    <SafeAreaView style={styles.boundaryScreen}>
      <View style={styles.boundaryMessage}>
        <Mascot size={96} speech={ready ? t('errorTitle') : FALLBACK_ERROR_TEXT} />
      </View>
      <ChunkyButton
        label={ready ? t('result:goHome') : FALLBACK_OK_TEXT}
        icon="🏠"
        onPress={() => {
          // Remount the crashed route first; if the crash is sticky, going
          // to the dashboard moves the child somewhere safe either way.
          void retry();
          router.replace('/(tabs)/home');
        }}
      />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: DAY_MS, buster: 'lessons-v3' }}
      >
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <GlobalErrorBanner />
        <LanguageTransitionOverlay />
        <StreakTracker />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boundaryScreen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  boundaryMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
