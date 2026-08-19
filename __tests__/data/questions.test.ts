import {
  allQuestionSets,
  getQuestionSet,
  QUESTIONS_PER_ATTEMPT,
} from '../../src/data/questions';

describe('question bank — data integrity', () => {
  it('ships only sets with 3 questions, 4 non-empty options and a valid answer index', () => {
    expect(allQuestionSets.length).toBeGreaterThanOrEqual(5);
    for (const set of allQuestionSets) {
      expect(set).toHaveLength(QUESTIONS_PER_ATTEMPT);
      for (const question of set) {
        expect(question.prompt.trim().length).toBeGreaterThan(0);
        expect(question.options).toHaveLength(4);
        for (const option of question.options) {
          expect(option.trim().length).toBeGreaterThan(0);
        }
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
      }
    }
  });
});

describe('getQuestionSet — deterministic set selection by lesson id', () => {
  it('returns the same set for the same lesson id every time', () => {
    for (const id of ['0', '10', '1084', 'abc']) {
      expect(getQuestionSet(id)).toBe(getQuestionSet(id));
    }
  });

  it('spreads different lesson ids across multiple sets', () => {
    const ids = Array.from({ length: 30 }, (_, i) => String(i));
    const distinctSets = new Set(ids.map((id) => getQuestionSet(id)));
    expect(distinctSets.size).toBeGreaterThan(1);
  });

  it('returns a valid set even for unusual ids', () => {
    for (const id of ['', ' ', '🦊', 'very-long-id-with-dashes-123456789']) {
      expect(getQuestionSet(id)).toHaveLength(QUESTIONS_PER_ATTEMPT);
    }
  });
});
