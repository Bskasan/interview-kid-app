/**
 * Exercises tab: a winding progress map over the paged lesson catalog.
 * Star-gated sequential unlocking, one speech bubble per tapped node, and all
 * the list behaviors it replaced: incremental page loading, offline banner,
 * pull-to-refresh, loading/error/empty states.
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canLoadMoreLessons } from '@/api/lessons';
import { FullScreenMessage } from '@/components/FullScreenMessage';
import { LessonBubble } from '@/components/LessonBubble';
import { MapNodeRow } from '@/components/MapNodeRow';
import { OfflineBanner } from '@/components/OfflineBanner';
import { MAP_ROW_HEIGHT } from '@/constants/map';
import { useLessons } from '@/hooks/useLessons';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NODE_CENTER_Y, nodeCenterX } from '@/lib/mapPath';
import { lessonStars, mapNodeStates, type MapNodeState } from '@/lib/unlock';
import { useProgressStore } from '@/store/progressStore';
import { colors, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';
import type { LessonResult } from '@/types/progress';

const END_REACHED_THRESHOLD = 0.5;
// Stable reference: a fresh {} per render would defeat the store selector.
const EMPTY_RESULTS: Record<string, LessonResult> = {};

type OpenBubble = {
  lesson: Lesson;
  state: MapNodeState;
  stars: number;
  /** Node center in the map viewport, snapshotted when the bubble opened. */
  anchor: { x: number; y: number };
};

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
  const results = useProgressStore((state) => (state.hasHydrated ? state.results : EMPTY_RESULTS));
  const { width: windowWidth } = useWindowDimensions();
  const mapWidth = windowWidth - 2 * spacing.lg;

  // Unlock states derive purely from the ordered star counts, so a result
  // recorded on the Result screen re-opens nodes live on return.
  const starsInOrder = useMemo(
    () => (lessons ?? []).map((lesson) => lessonStars(results[lesson.id])),
    [lessons, results],
  );
  const nodeStates = useMemo(() => mapNodeStates(starsInOrder), [starsInOrder]);

  // One bubble at a time; its anchor is computed from index + scroll offset —
  // no native measurement, so virtualization can never hand out a stale frame.
  const [bubble, setBubble] = useState<OpenBubble | null>(null);
  const scrollOffsetRef = useRef(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const navigateOnce = useNavigationLock({ resetOnFocus: true });
  const startLesson = useCallback(
    (lessonId: string) => {
      setBubble(null);
      navigateOnce(() => router.push(`/exercise/${lessonId}`));
    },
    [navigateOnce, router],
  );

  const handleEndReached = useCallback(() => {
    if (canLoadMoreLessons({ hasNextPage, isFetchingNextPage, isOffline })) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOffline]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);
  const closeBubble = useCallback(() => setBubble(null), []);
  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const lessonCount = lessons?.length ?? 0;
  const renderItem = useCallback(
    ({ item, index }: { item: Lesson; index: number }) => (
      <MapNodeRow
        lesson={item}
        index={index}
        state={nodeStates[index] ?? 'locked'}
        stars={starsInOrder[index] ?? 0}
        width={mapWidth}
        isLast={index === lessonCount - 1 && !hasNextPage}
        onPress={() =>
          // Anchor snapshotted here (event handler — the render itself never
          // touches the scroll ref); a scroll closes the bubble anyway.
          setBubble({
            lesson: item,
            state: nodeStates[index] ?? 'locked',
            stars: starsInOrder[index] ?? 0,
            anchor: {
              x: spacing.lg + nodeCenterX(index, mapWidth),
              y: index * MAP_ROW_HEIGHT + NODE_CENTER_Y - scrollOffsetRef.current,
            },
          })
        }
      />
    ),
    [nodeStates, starsInOrder, mapWidth, lessonCount, hasNextPage],
  );

  const hasLessons = lessonCount > 0;

  let content;
  if (isPending) {
    content = (
      <View style={styles.loading} accessibilityLabel={t('common:loading')}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (hasLessons) {
    // A failed background refetch keeps showing cached data (the map stays up).
    content = (
      <View style={styles.mapViewport} onLayout={handleViewportLayout}>
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          getItemLayout={(_, index) => ({
            length: MAP_ROW_HEIGHT,
            offset: MAP_ROW_HEIGHT * index,
            index,
          })}
          onEndReached={handleEndReached}
          onEndReachedThreshold={END_REACHED_THRESHOLD}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          // Scrolling would leave the bubble pointing at a moved node.
          onScrollBeginDrag={closeBubble}
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
        {bubble ? (
          <LessonBubble
            lesson={bubble.lesson}
            state={bubble.state}
            stars={bubble.stars}
            anchor={bubble.anchor}
            containerWidth={windowWidth}
            containerHeight={viewportHeight}
            onStart={() => startLesson(bubble.lesson.id)}
            onClose={closeBubble}
          />
        ) : null}
      </View>
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
        <Text style={styles.title}>{t('common:tabs.exercises')}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  mapViewport: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
