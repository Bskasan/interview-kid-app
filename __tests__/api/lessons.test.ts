import type { InfiniteData } from '@tanstack/react-query';
import {
  canLoadMoreLessons,
  fetchLessonsPage,
  flattenLessonPages,
  mapLessons,
  nextLessonsPageParam,
  previousLessonsPageParam,
  type LessonsPage,
} from '../../src/api/lessons';
import { LESSONS_PAGE_SIZE } from '../../src/constants/api';
import type { Lesson } from '../../src/types/lesson';

const rawItems = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({ id: `${offset + i + 1}`, author: `Author ${i}` }));

const page = (overrides: Partial<LessonsPage>): LessonsPage => ({
  lessons: [],
  page: 1,
  isLastPage: false,
  ...overrides,
});

const infinite = (pages: LessonsPage[]): InfiniteData<LessonsPage, number> => ({
  pages,
  pageParams: pages.map((p) => p.page),
});

describe('mapLessons — picsum payload to Lesson[] mapping', () => {
  it('maps well-formed picsum items to numbered lessons with thumbnail urls', () => {
    const lessons = mapLessons(
      [
        { id: '10', author: 'Paul Jarvis', width: 300, height: 200 },
        { id: 25, author: 'Alejandro Escamilla' },
      ],
      1,
    );

    expect(lessons).toEqual([
      {
        id: '10',
        lessonNumber: 1,
        author: 'Paul Jarvis',
        thumbnailUrl: 'https://picsum.photos/id/10/200/200',
      },
      {
        id: '25',
        lessonNumber: 2,
        author: 'Alejandro Escamilla',
        thumbnailUrl: 'https://picsum.photos/id/25/200/200',
      },
    ]);
  });

  it('skips malformed or duplicate items without gaps in numbering within the page', () => {
    const lessons = mapLessons(
      [
        null,
        'not-an-object',
        { id: '1' }, // missing author
        { id: '2', author: '   ' }, // blank author
        { author: 'No Id' },
        { id: {}, author: 'Bad Id Type' },
        { id: '3', author: 'Valid One' },
        { id: '3', author: 'Duplicate Id' },
        { id: '4', author: 'Valid Two' },
      ],
      1,
    );

    expect(lessons.map((l) => [l.lessonNumber, l.author])).toEqual([
      [1, 'Valid One'],
      [2, 'Valid Two'],
    ]);
  });

  it('anchors numbering to the page slot so later pages continue the global sequence', () => {
    const pageTwo = mapLessons(
      [
        { id: '31', author: 'Ada' },
        { id: '32', author: 'Grace' },
      ],
      2,
    );

    expect(pageTwo.map((l) => l.lessonNumber)).toEqual([
      LESSONS_PAGE_SIZE + 1,
      LESSONS_PAGE_SIZE + 2,
    ]);
  });

  it.each([null, undefined, 42, 'garbage', { not: 'an array' }])(
    'returns an empty list instead of crashing for non-array payload %p',
    (payload) => {
      expect(mapLessons(payload, 1)).toEqual([]);
    },
  );
});

describe('pagination helpers', () => {
  it('requests the next page while pages come back full, stops at a short page', () => {
    expect(nextLessonsPageParam(page({ page: 3, isLastPage: false }))).toBe(4);
    expect(nextLessonsPageParam(page({ page: 3, isLastPage: true }))).toBeUndefined();
  });

  it('refills backwards only when a page before the window exists', () => {
    expect(previousLessonsPageParam(page({ page: 1 }))).toBeUndefined();
    expect(previousLessonsPageParam(page({ page: 4 }))).toBe(3);
  });

  it('flattens pages in order and drops duplicate ids across page boundaries', () => {
    const lesson = (id: string, lessonNumber: number): Lesson => ({
      id,
      lessonNumber,
      author: `Author ${id}`,
      thumbnailUrl: `https://picsum.photos/id/${id}/200/200`,
    });
    const flat = flattenLessonPages(
      infinite([
        page({ page: 1, lessons: [lesson('1', 1), lesson('2', 2)] }),
        // picsum repeated id '2' at the boundary; the first occurrence wins
        page({ page: 2, lessons: [lesson('2', 11), lesson('3', 12)] }),
      ]),
    );

    expect(flat.map((l) => l.id)).toEqual(['1', '2', '3']);
    expect(flat.map((l) => l.lessonNumber)).toEqual([1, 2, 12]);
  });

  it('allows loading more only when idle, online and not at the end', () => {
    const base = { hasNextPage: true, isFetchingNextPage: false, isOffline: false };
    expect(canLoadMoreLessons(base)).toBe(true);
    expect(canLoadMoreLessons({ ...base, hasNextPage: false })).toBe(false);
    expect(canLoadMoreLessons({ ...base, isFetchingNextPage: true })).toBe(false);
    expect(canLoadMoreLessons({ ...base, isOffline: true })).toBe(false);
  });
});

describe('fetchLessonsPage — network fetcher for one lesson page', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects with the http status when the response is not ok', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as unknown as Response);

    await expect(fetchLessonsPage(1)).rejects.toThrow('500');
  });

  it('requests the given page with an abortable signal and maps the response', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{ id: '7', author: 'Ada' }],
    } as unknown as Response);

    await expect(fetchLessonsPage(2)).resolves.toEqual({
      page: 2,
      isLastPage: true, // one raw item < page size
      lessons: [
        {
          id: '7',
          lessonNumber: LESSONS_PAGE_SIZE + 1,
          author: 'Ada',
          thumbnailUrl: 'https://picsum.photos/id/7/200/200',
        },
      ],
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://picsum.photos/v2/list?page=2&limit=${LESSONS_PAGE_SIZE}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('judges end-of-list on the raw length, not on how many items survived validation', async () => {
    // A full raw page where some items fail validation must NOT end the list.
    const rawFullPage = [...rawItems(LESSONS_PAGE_SIZE - 2), null, { id: '9' }];
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => rawFullPage,
    } as unknown as Response);

    const result = await fetchLessonsPage(1);
    expect(result.lessons).toHaveLength(LESSONS_PAGE_SIZE - 2);
    expect(result.isLastPage).toBe(false);
  });

  it.each([[[]], [{ not: 'an array' }]])(
    'treats %p as the end of the list instead of paging forever',
    async (payload) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => payload,
      } as unknown as Response);

      const result = await fetchLessonsPage(3);
      expect(result.lessons).toEqual([]);
      expect(result.isLastPage).toBe(true);
    },
  );
});
