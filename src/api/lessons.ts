/**
 * The lesson list's data layer: fetches picsum pages (with an abort timeout),
 * defensively maps unknown JSON to language-neutral Lessons with globally
 * sequential numbering, and provides the pure pagination helpers (capped
 * next-page param, cross-page flatten + dedupe, load-more guard) for useLessons.
 */
import type { InfiniteData } from '@tanstack/react-query';
import {
  LESSON_THUMBNAIL_SIZE,
  LESSONS_PAGE_SIZE,
  LESSONS_TOTAL_LIMIT,
  PICSUM_BASE_URL,
} from '@/constants/api';
import { REQUEST_TIMEOUT_MS } from '@/constants/timing';
import type { Lesson } from '@/types/lesson';

/** One fetched page plus what the pager needs to know about it. */
export type LessonsPage = {
  lessons: Lesson[];
  page: number;
  /** True when picsum returned fewer raw items than a full page — end of list. */
  isLastPage: boolean;
};

/**
 * Maps one raw picsum page to Lesson[]. Defensive by policy: unknown input
 * never throws — a malformed item is skipped, a malformed payload yields [].
 * "Ders N" numbering is anchored to the page slot ((page-1) × page size), so
 * numbers never shift when other pages load, refetch, or are dropped from the
 * cache; a skipped item moves numbers only inside its own page.
 */
export function mapLessons(data: unknown, page: number): Lesson[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const firstNumber = (page - 1) * LESSONS_PAGE_SIZE + 1;
  const lessons: Lesson[] = [];
  const seenIds = new Set<string>();
  for (const item of data) {
    const lesson = mapLesson(item, firstNumber + lessons.length);
    if (lesson && !seenIds.has(lesson.id)) {
      seenIds.add(lesson.id);
      lessons.push(lesson);
    }
  }
  return lessons;
}

function mapLesson(item: unknown, lessonNumber: number): Lesson | null {
  if (typeof item !== 'object' || item === null) {
    return null;
  }
  const { id, author } = item as Record<string, unknown>;

  const idText =
    typeof id === 'string' && id.trim().length > 0
      ? id.trim()
      : typeof id === 'number' && Number.isFinite(id)
        ? String(id)
        : null;
  const authorText = typeof author === 'string' && author.trim().length > 0 ? author.trim() : null;

  if (idText === null || authorText === null) {
    return null;
  }
  // No display text here: the model (and the persisted query cache) stays
  // language-neutral, so a locale switch never shows stale-language titles.
  return {
    id: idText,
    lessonNumber,
    author: authorText,
    thumbnailUrl: lessonThumbnailUrl(idText),
  };
}

/**
 * Thumbnail for a lesson (picsum) — derivable from the id alone, so screens
 * that only have the route param (e.g. the exit sheet) need no query access.
 */
export function lessonThumbnailUrl(lessonId: string): string {
  return `${PICSUM_BASE_URL}/id/${lessonId}/${LESSON_THUMBNAIL_SIZE}/${LESSON_THUMBNAIL_SIZE}`;
}

/** Last page the app will ever request — the catalog is capped, not endless. */
const LESSONS_LAST_PAGE = Math.ceil(LESSONS_TOTAL_LIMIT / LESSONS_PAGE_SIZE);

/**
 * getNextPageParam: keep paging while pages come back full, but never past the
 * fixed 20-lesson catalog (the short-page rule stays as a safety net should
 * picsum ever return less than asked).
 */
export function nextLessonsPageParam(lastPage: LessonsPage): number | undefined {
  if (lastPage.isLastPage || lastPage.page >= LESSONS_LAST_PAGE) {
    return undefined;
  }
  return lastPage.page + 1;
}

/**
 * Flattens cached pages for the list. Picsum can repeat an id at page
 * boundaries; the first occurrence wins so FlatList keys stay unique.
 */
export function flattenLessonPages(data: InfiniteData<LessonsPage, number>): Lesson[] {
  const seenIds = new Set<string>();
  const lessons: Lesson[] = [];
  for (const pageData of data.pages) {
    for (const lesson of pageData.lessons) {
      if (!seenIds.has(lesson.id)) {
        seenIds.add(lesson.id);
        lessons.push(lesson);
      }
    }
  }
  return lessons;
}

/**
 * Single gate for onEndReached: no request while one is in flight (FlatList
 * fires the callback repeatedly), past the end, or offline (a paused fetch
 * would strand the footer spinner).
 */
export function canLoadMoreLessons(args: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isOffline: boolean;
}): boolean {
  return args.hasNextPage && !args.isFetchingNextPage && !args.isOffline;
}

export async function fetchLessonsPage(page: number): Promise<LessonsPage> {
  // Hermes has no AbortSignal.timeout; a manual controller keeps a hung request
  // from pinning the query in loading state forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${PICSUM_BASE_URL}/v2/list?page=${page}&limit=${LESSONS_PAGE_SIZE}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`Lessons request failed with status ${response.status}`);
    }
    const raw: unknown = await response.json();
    // End-of-list is judged on the RAW length: validation may drop items from a
    // full page, and a short mapped page must not end pagination early. A
    // non-array payload maps to [] and ends the list instead of looping.
    const isLastPage = !Array.isArray(raw) || raw.length < LESSONS_PAGE_SIZE;
    return { lessons: mapLessons(raw, page), page, isLastPage };
  } finally {
    clearTimeout(timer);
  }
}
