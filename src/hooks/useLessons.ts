/**
 * The lesson list's server state: an infinite React Query over picsum pages
 * (capped at the fixed 20-lesson catalog), cached (and offline-restored) under
 * the 'lessons' key by the root provider. Screens receive a flat, deduped,
 * globally numbered Lesson[] via select.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLessonsPage, flattenLessonPages, nextLessonsPageParam } from '@/api/lessons';
import { LESSONS_FIRST_PAGE } from '@/constants/api';

export function useLessons() {
  return useInfiniteQuery({
    queryKey: ['lessons'],
    queryFn: ({ pageParam }) => fetchLessonsPage(pageParam),
    initialPageParam: LESSONS_FIRST_PAGE,
    getNextPageParam: nextLessonsPageParam,
    select: flattenLessonPages,
  });
}
