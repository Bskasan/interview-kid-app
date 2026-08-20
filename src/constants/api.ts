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
 * Pages React Query keeps in memory and in the persisted cache (maxPages).
 * 5 × LESSONS_PAGE_SIZE items bounds AsyncStorage growth while holding more
 * lessons than a child can pass in one sitting; older pages refill on demand.
 */
export const LESSONS_MAX_PAGES = 5;

/** Square edge (px) requested from picsum for lesson thumbnails. */
export const LESSON_THUMBNAIL_SIZE = 200;
