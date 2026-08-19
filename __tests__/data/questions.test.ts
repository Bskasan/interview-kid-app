import {
  allQuestionSets,
  getQuestionSet,
  optionA11yLabel,
  QUESTIONS_PER_ATTEMPT,
  type OptionVisual,
} from '../../src/data/questions';
import i18n from '../../src/i18n';

// Language-neutral data + per-language text: integrity must hold in BOTH
// languages, so every check runs against a fixed t per locale.
const LOCALES = ['tr', 'en'] as const;

describe('question bank — data integrity', () => {
  it.each(LOCALES)(
    'resolves every prompt and gives options unique spoken labels in %s',
    (locale) => {
      const t = i18n.getFixedT(locale, 'questions');
      expect(allQuestionSets.length).toBeGreaterThanOrEqual(5);
      for (const set of allQuestionSets) {
        expect(set).toHaveLength(QUESTIONS_PER_ATTEMPT);
        for (const question of set) {
          const prompt = t(question.promptKey);
          expect(prompt.trim().length).toBeGreaterThan(0);
          // A missing key would echo the key itself back — catch that too.
          expect(prompt).not.toBe(question.promptKey);

          const labels = question.options.map((option) => optionA11yLabel(option, t));
          for (const label of labels) {
            expect(label.trim().length).toBeGreaterThan(0);
          }
          // A screen reader must never announce two indistinguishable answers.
          expect(new Set(labels).size).toBe(4);
          expect(question.correctIndex).toBeGreaterThanOrEqual(0);
          expect(question.correctIndex).toBeLessThan(4);
        }
      }
    },
  );

  it('uses at most one network image in the whole bank, with an offline emoji fallback', () => {
    const imageVisuals = allQuestionSets
      .flat()
      .flatMap((question) => question.options)
      .map((option) => option.visual)
      .filter(
        (visual): visual is Extract<OptionVisual, { kind: 'image' }> => visual?.kind === 'image',
      );
    expect(imageVisuals.length).toBeLessThanOrEqual(1);
    for (const visual of imageVisuals) {
      expect(visual.fallbackEmoji.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('getQuestionSet — deterministic set selection by lesson id', () => {
  it('returns the same set for the same lesson id every time', () => {
    for (const id of ['0', '10', '1084', 'abc']) {
      expect(getQuestionSet(id)).toBe(getQuestionSet(id));
    }
  });

  it('makes every question set reachable across realistic lesson ids', () => {
    const ids = Array.from({ length: 30 }, (_, i) => String(i));
    const distinctSets = new Set(ids.map((id) => getQuestionSet(id)));
    expect(distinctSets.size).toBe(allQuestionSets.length);
  });

  it('returns a valid set even for unusual ids', () => {
    for (const id of ['', ' ', '🦊', 'very-long-id-with-dashes-123456789']) {
      expect(getQuestionSet(id)).toHaveLength(QUESTIONS_PER_ATTEMPT);
    }
  });
});
