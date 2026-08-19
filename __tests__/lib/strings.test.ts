import { strings } from '../../src/lib/strings';

describe('strings — parameterized Turkish copy', () => {
  // The lesson-title format is load-bearing: mapLessons composes Home titles with it.
  it('builds lesson title, question counter and score lines from parameters', () => {
    expect(strings.home.lessonTitle(3, 'Ada')).toBe('Ders 3: Ada');
    expect(strings.exercise.question(2, 3)).toBe('Soru 2/3');
    expect(strings.result.score(2, 3)).toBe('2/3 doğru');
  });
});
