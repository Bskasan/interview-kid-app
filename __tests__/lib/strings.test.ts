import { strings } from '../../src/lib/strings';

describe('strings', () => {
  it('provides non-empty labels for every static entry', () => {
    const walk = (node: object) => {
      for (const value of Object.values(node)) {
        if (typeof value === 'string') {
          expect(value.trim().length).toBeGreaterThan(0);
        } else if (typeof value === 'object' && value !== null) {
          walk(value);
        }
      }
    };
    walk(strings);
  });

  it('interpolates template strings', () => {
    expect(strings.home.lessonTitle(3, 'Ada')).toBe('Ders 3: Ada');
    expect(strings.exercise.question(2, 3)).toBe('Soru 2/3');
    expect(strings.result.score(2, 3)).toBe('2/3 doğru');
  });
});
