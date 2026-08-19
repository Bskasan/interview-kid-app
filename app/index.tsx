import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FullScreenMessage } from '@/components/FullScreenMessage';
import { LESSON_CARD_GAP, LESSON_CARD_HEIGHT, LessonCard } from '@/components/LessonCard';
import { LessonCardSkeleton } from '@/components/LessonCardSkeleton';
import { Mascot } from '@/components/Mascot';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useLessons } from '@/hooks/useLessons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { strings } from '@/lib/strings';
import { colors, spacing, typography } from '@/theme';
import type { Lesson } from '@/types/lesson';

const SKELETON_COUNT = 5;

const ListGap = () => <View style={{ height: LESSON_CARD_GAP }} />;

export default function HomeScreen() {
  const router = useRouter();
  const { data: lessons, isPending, isError, refetch, isRefetching } = useLessons();
  const { isOffline } = useNetworkStatus();

  // A fast double-tap on a card must not push two exercise screens; the lock
  // re-opens whenever Home regains focus (ADR 0018).
  const navLockRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      navLockRef.current = false;
    }, [])
  );
  const openLesson = useCallback(
    (lessonId: string) => {
      if (navLockRef.current) {
        return;
      }
      navLockRef.current = true;
      router.push(`/exercise/${lessonId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Lesson }) => <LessonCard lesson={item} onPress={() => openLesson(item.id)} />,
    [openLesson]
  );

  const hasLessons = !!lessons && lessons.length > 0;

  let content;
  if (isPending) {
    content = (
      <View style={styles.skeletons} accessibilityLabel={strings.common.loading}>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
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
          isError
            ? isOffline
              ? strings.home.offlineNoCache
              : strings.common.errorTitle
            : strings.home.emptyTitle
        }
        actionLabel={strings.common.retry}
        onAction={() => refetch()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.home.title}</Text>
        <Mascot size={48} speech={strings.home.greeting} />
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
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skeletons: {
    paddingHorizontal: spacing.lg,
    gap: LESSON_CARD_GAP,
  },
});
