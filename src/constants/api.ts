/**
 * Picsum endpoint and paging values for the incrementally loaded lesson list —
 * the app's one remote data source. URL composition from these lives in
 * src/api/lessons.ts.
 */
export const PICSUM_BASE_URL = 'https://picsum.photos';

/** First page requested on cold load; pull-to-refresh refetches from here. */
export const LESSONS_FIRST_PAGE = 1;

/** Items per page. A page that comes back shorter than this marks the end of the list. */
export const LESSONS_PAGE_SIZE = 10;

/**
 * The course is a fixed catalog, not an endless feed: the brief asks for
 * 15–20 items and the level map (round 5) assumes a finite lesson sequence.
 * Paging stops here even though picsum could serve more.
 */
export const LESSONS_TOTAL_LIMIT = 20;

/** Square edge (px) requested from picsum for lesson thumbnails. */
export const LESSON_THUMBNAIL_SIZE = 200;
