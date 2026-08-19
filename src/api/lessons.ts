import { strings } from '@/lib/strings';
import type { Lesson } from '@/types/lesson';

const LIST_URL = 'https://picsum.photos/v2/list?page=1&limit=20';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Maps the raw picsum list response to Lesson[].
 * Defensive by policy: unknown input never throws — a malformed item is
 * skipped, a malformed payload yields []. Lesson numbering stays contiguous over the
 * items that survived, so a skipped item never produces a gap like "Ders 7" missing.
 */
export function mapLessons(data: unknown): Lesson[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const lessons: Lesson[] = [];
  const seenIds = new Set<string>();
  for (const item of data) {
    const lesson = mapLesson(item, lessons.length + 1);
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
  return {
    id: idText,
    title: strings.home.lessonTitle(lessonNumber, authorText),
    thumbnailUrl: `https://picsum.photos/id/${idText}/200/200`,
  };
}

export async function fetchLessons(): Promise<Lesson[]> {
  // Hermes has no AbortSignal.timeout; a manual controller keeps a hung request
  // from pinning the query in loading state forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(LIST_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Lessons request failed with status ${response.status}`);
    }
    return mapLessons(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
