/**
 * The language-neutral lesson model mapped from the picsum list — no display
 * text baked in, so persisted caches survive a language switch.
 */
export type Lesson = {
  /** picsum image id — also selects the question set and the thumbnail. */
  id: string;
  /** 1-based position in the list; the display title is composed at render time. */
  lessonNumber: number;
  /** picsum author name, the human part of the title. */
  author: string;
  thumbnailUrl: string;
};

/** One fetched page plus what the pager needs to know about it. */
export type LessonsPage = {
  lessons: Lesson[];
  page: number;
  isLastPage: boolean;
};
