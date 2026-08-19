export type Lesson = {
  /** picsum image id — also selects the question set and the thumbnail. */
  id: string;
  /** 1-based position in the list; the display title is composed at render time. */
  lessonNumber: number;
  /** picsum author name, the human part of the title. */
  author: string;
  thumbnailUrl: string;
};
