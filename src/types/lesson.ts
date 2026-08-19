export type Lesson = {
  /** picsum image id — also selects the question set and the thumbnail. */
  id: string;
  /** Display title, e.g. "Ders 3: Alejandro Escamilla". */
  title: string;
  thumbnailUrl: string;
  author: string;
};
