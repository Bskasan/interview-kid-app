/**
 * The lesson list's server state: an infinite React Query over picsum pages,
 * cached (and offline-restored) under the 'lessons' key by the root provider.
 * Screens receive a flat, deduped, globally numbered Lesson[] via select.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchLessonsPage,
  flattenLessonPages,
  nextLessonsPageParam,
  previousLessonsPageParam,
} from '@/api/lessons';
import { LESSONS_FIRST_PAGE, LESSONS_MAX_PAGES } from '@/constants/api';

export function useLessons() {
  return useInfiniteQuery({
    queryKey: ['lessons'],
    queryFn: ({ pageParam }) => fetchLessonsPage(pageParam),
    initialPageParam: LESSONS_FIRST_PAGE,
    getNextPageParam: nextLessonsPageParam,
    // maxPages caps memory + AsyncStorage; the previous-param lets React Query
    // refill dropped front pages if the child scrolls back up past the window.
    getPreviousPageParam: previousLessonsPageParam,
    maxPages: LESSONS_MAX_PAGES,
    select: flattenLessonPages,
  });
}
