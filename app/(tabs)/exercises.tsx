/**
 * Exercises tab: the lesson list loaded page by page from picsum as the child
 * scrolls (cached for offline), with per-lesson progress on each card,
 * pull-to-refresh, offline banner, and loading/error/empty states.
 * Tapping a card opens the full-screen Exercise route outside the tabs.
 */
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canLoadMoreLessons } from '@/api/lessons';
import { FullScreenMessage } from '@/components/FullScreenMessage';
import { LESSON_CARD_GAP, LESSON_CARD_HEIGHT, LessonCard } from '@/components/LessonCard';
import { LessonCardSkeleton } from '@/components/LessonCardSkeleton';
import { Mascot } from '@/components/Mascot';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useLessons } from '@/hooks/useLessons';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';

const SKELETON_COUNT = 5;
const END_REACHED_THRESHOLD = 0.5;

const ListGap = () => <View style={{ height: LESSON_CARD_GAP }} />;

export default function ExercisesScreen() {
  const { t } = useTranslation(['home', 'common']);
  const router = useRouter();
  const {
    data: lessons,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLessons();
  const { isOffline } = useNetworkStatus();

  // A fast double-tap on a card must not push two exercise screens; the lock
  // re-opens whenever the tab regains focus.
  const navigateOnce = useNavigationLock({ resetOnFocus: true });
  const openLesson = useCallback(
    (lessonId: string) => navigateOnce(() => router.push(`/exercise/${lessonId}`)),
    [navigateOnce, router],
  );

  // FlatList is known to fire onEndReached more than once per scroll; the pure
  // guard stops calls once React Query's state has flipped, and cancelRefetch:
  // false makes any same-render duplicate a no-op instead of a restarted fetch.
  const handleEndReached = useCallback(() => {
    if (canLoadMoreLessons({ hasNextPage, isFetchingNextPage, isOffline })) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOffline]);

  const renderItem = useCallback(
    ({ item }: { item: Lesson }) => (
      <LessonCard lesson={item} onPress={() => openLesson(item.id)} />
    ),
    [openLesson],
  );

  const hasLessons = !!lessons && lessons.length > 0;

  let content;
  if (isPending) {
    content = (
      <View style={styles.skeletons} accessibilityLabel={t('common:loading')}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <LessonCardSkeleton key={i} />
        ))}
      </View>
    );
  } else if (hasLessons) {
    // A failed background refetch keeps showing cached data (list stays up).
    content = (
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={ListGap}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: LESSON_CARD_HEIGHT,
          offset: (LESSON_CARD_HEIGHT + LESSON_CARD_GAP) * index,
          index,
        })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        testID="lesson-list"
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.footerText} maxFontSizeMultiplier={1.4}>
                {t('loadingMore')}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            // isRefetching is also true while a next page loads; only a real
            // pull-to-refresh should show the top spinner.
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  } else {
    // No data at all: network error (offline gets a friendlier line) or a
    // technically-successful-but-empty payload.
    content = (
      <FullScreenMessage
        speech={
          isError ? (isOffline ? t('offlineNoCache') : t('common:errorTitle')) : t('emptyTitle')
        }
        actionLabel={t('common:retry')}
        onAction={() => refetch()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
        <Mascot size={48} speech={t('greeting')} />
      </View>
      {isOffline ? <OfflineBanner /> : null}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: LESSON_CARD_GAP,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.muted,
  },
});
