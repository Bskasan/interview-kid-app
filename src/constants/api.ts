/**
 * Picsum endpoint and paging values for the Home lesson list — the app's one
 * remote data source. URL composition from these lives in src/api/lessons.ts.
 */

export const PICSUM_BASE_URL = 'https://picsum.photos';

/** The brief asks for 15–20 items; one page of 20 covers it without paging UI. */
export const LESSONS_PAGE = 1;
export const LESSONS_PAGE_SIZE = 20;

/** Square edge (px) requested from picsum for lesson thumbnails. */
export const LESSON_THUMBNAIL_SIZE = 200;
