import { fetchLessons, mapLessons } from '../../src/api/lessons';

describe('mapLessons', () => {
  it('maps valid picsum items to lessons', () => {
    const lessons = mapLessons([
      { id: '10', author: 'Paul Jarvis', width: 300, height: 200 },
      { id: 25, author: 'Alejandro Escamilla' },
    ]);

    expect(lessons).toEqual([
      {
        id: '10',
        author: 'Paul Jarvis',
        title: 'Ders 1: Paul Jarvis',
        thumbnailUrl: 'https://picsum.photos/id/10/200/200',
      },
      {
        id: '25',
        author: 'Alejandro Escamilla',
        title: 'Ders 2: Alejandro Escamilla',
        thumbnailUrl: 'https://picsum.photos/id/25/200/200',
      },
    ]);
  });

  it('skips malformed items and keeps numbering contiguous', () => {
    const lessons = mapLessons([
      null,
      'not-an-object',
      { id: '1' }, // missing author
      { id: '2', author: '   ' }, // blank author
      { author: 'No Id' },
      { id: {}, author: 'Bad Id Type' },
      { id: '3', author: 'Valid One' },
      { id: '3', author: 'Duplicate Id' },
      { id: '4', author: 'Valid Two' },
    ]);

    expect(lessons.map((l) => l.title)).toEqual(['Ders 1: Valid One', 'Ders 2: Valid Two']);
  });

  it.each([null, undefined, 42, 'garbage', { not: 'an array' }])(
    'returns an empty list for non-array payload %p',
    (payload) => {
      expect(mapLessons(payload)).toEqual([]);
    }
  );
});

describe('fetchLessons', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects on a non-ok response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as unknown as Response);

    await expect(fetchLessons()).rejects.toThrow('500');
  });

  it('resolves mapped lessons on success', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [{ id: '7', author: 'Ada' }],
    } as unknown as Response);

    await expect(fetchLessons()).resolves.toEqual([
      {
        id: '7',
        author: 'Ada',
        title: 'Ders 1: Ada',
        thumbnailUrl: 'https://picsum.photos/id/7/200/200',
      },
    ]);
  });
});
