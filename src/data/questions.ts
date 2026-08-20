import type { TFunction } from 'i18next';
import type tr from '@/locales/tr.json';
import { colors } from '@/theme';
import { hashString } from '@/utils/hashString';

/**
 * Local mock quiz content (the brief allows local data for the exercise).
 * Ages 5–8, pre-readers first: every option is a big visual (emoji, drawn shape
 * or photo) with an optional short label. The data here is language-neutral —
 * structure, visuals and answers — while every displayed or spoken text lives in
 * the `questions` i18n namespace and is resolved at render time. Five sets; a
 * lesson picks one deterministically from its id, so the same lesson always
 * asks the same questions — retakes stay comparable.
 */
export type ShapeName = 'circle' | 'square' | 'triangle' | 'star';

type QuestionsResource = (typeof tr)['questions'];

type DotPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
    }[keyof T & string];

/** A key inside the `questions` namespace, checked against tr.json by tsc. */
export type QuestionTextKey = DotPaths<QuestionsResource>;

/** The t function bound to the `questions` namespace. */
export type QuestionsT = TFunction<'questions'>;

export type OptionVisual =
  | { kind: 'emoji'; value: string }
  | { kind: 'shape'; shape: ShapeName; color: keyof typeof colors }
  // fallbackEmoji keeps an image option answerable offline or on load error.
  | { kind: 'image'; uri: string; fallbackEmoji: string };

/**
 * Every option resolves to a non-empty spoken label by construction: either a
 * labelKey/a11yKey points into the questions namespace, or the option is a drawn
 * shape whose label is derived from its color + shape tokens.
 */
export type AnswerOptionData =
  | { labelKey: QuestionTextKey; a11yKey?: QuestionTextKey; visual?: OptionVisual }
  | { labelKey?: undefined; a11yKey: QuestionTextKey; visual: OptionVisual }
  | {
      labelKey?: undefined;
      a11yKey?: undefined;
      visual: Extract<OptionVisual, { kind: 'shape' }>;
    };

export type Question = {
  promptKey: QuestionTextKey;
  /** Exactly four answer options. */
  options: readonly [AnswerOptionData, AnswerOptionData, AnswerOptionData, AnswerOptionData];
  correctIndex: 0 | 1 | 2 | 3;
};

export type QuestionSet = readonly Question[];

/** Visible caption under a visual, when the option has one. */
export function optionLabel(option: AnswerOptionData, t: QuestionsT): string | undefined {
  return option.labelKey !== undefined ? t(option.labelKey) : undefined;
}

/**
 * What a screen reader announces for an option. Total by construction; shape
 * options compose "{{color}} {{shape}}" through the namespace template so word
 * order follows the language, not the code.
 */
export function optionA11yLabel(option: AnswerOptionData, t: QuestionsT): string {
  if (option.labelKey !== undefined) {
    return t(option.a11yKey ?? option.labelKey);
  }
  if (option.a11yKey !== undefined) {
    return t(option.a11yKey);
  }
  const { color, shape } = option.visual;
  return t('shapeOption', {
    color: t(`color.${color}`),
    shape: t(`shape.${shape}`),
  });
}

const shapeOpt = (shape: ShapeName, color: keyof typeof colors): AnswerOptionData => ({
  visual: { kind: 'shape', shape, color },
});

const emojiOpt = (value: string, labelKey: QuestionTextKey): AnswerOptionData => ({
  visual: { kind: 'emoji', value },
  labelKey,
});

const textOpt = (labelKey: QuestionTextKey): AnswerOptionData => ({ labelKey });

const questionSets: readonly QuestionSet[] = [
  // Shapes — find the named shape among drawn shapes
  [
    {
      promptKey: 'shapes.q1.prompt',
      options: [
        shapeOpt('square', 'sky'),
        shapeOpt('triangle', 'coral'),
        shapeOpt('circle', 'sun'),
        shapeOpt('star', 'grape'),
      ],
      correctIndex: 1,
    },
    {
      promptKey: 'shapes.q2.prompt',
      options: [
        shapeOpt('star', 'sun'),
        shapeOpt('circle', 'sky'),
        shapeOpt('square', 'grape'),
        shapeOpt('triangle', 'primary'),
      ],
      correctIndex: 0,
    },
    {
      promptKey: 'shapes.q3.prompt',
      options: [
        shapeOpt('square', 'coral'),
        shapeOpt('star', 'primary'),
        shapeOpt('triangle', 'sky'),
        shapeOpt('circle', 'grape'),
      ],
      correctIndex: 3,
    },
  ],
  // Colors — same shape everywhere so only the color differs
  [
    {
      promptKey: 'colors.q1.prompt',
      options: [
        shapeOpt('circle', 'primary'),
        shapeOpt('circle', 'sun'),
        shapeOpt('circle', 'sky'),
        shapeOpt('circle', 'grape'),
      ],
      correctIndex: 2,
    },
    {
      promptKey: 'colors.q2.prompt',
      options: [
        shapeOpt('square', 'sun'),
        shapeOpt('square', 'grape'),
        shapeOpt('square', 'coral'),
        shapeOpt('square', 'sky'),
      ],
      correctIndex: 0,
    },
    {
      promptKey: 'colors.q3.prompt',
      options: [
        shapeOpt('star', 'grape'),
        shapeOpt('star', 'primary'),
        shapeOpt('star', 'sky'),
        shapeOpt('star', 'sun'),
      ],
      correctIndex: 1,
    },
  ],
  // Counting — the prompt carries the emoji, options are big digits
  [
    {
      promptKey: 'counting.q1.prompt',
      options: [
        textOpt('counting.q1.options.o1'),
        textOpt('counting.q1.options.o2'),
        textOpt('counting.q1.options.o3'),
        textOpt('counting.q1.options.o4'),
      ],
      correctIndex: 1,
    },
    {
      promptKey: 'counting.q2.prompt',
      options: [
        textOpt('counting.q2.options.o1'),
        textOpt('counting.q2.options.o2'),
        textOpt('counting.q2.options.o3'),
        textOpt('counting.q2.options.o4'),
      ],
      correctIndex: 2,
    },
    {
      promptKey: 'counting.q3.prompt',
      options: [
        textOpt('counting.q3.options.o1'),
        textOpt('counting.q3.options.o2'),
        textOpt('counting.q3.options.o3'),
        textOpt('counting.q3.options.o4'),
      ],
      correctIndex: 2,
    },
  ],
  // Animals — emoji visuals with a short word underneath
  [
    {
      promptKey: 'animals.q1.prompt',
      options: [
        emojiOpt('🐄', 'animals.q1.options.o1'),
        emojiOpt('🐱', 'animals.q1.options.o2'),
        emojiOpt('🐑', 'animals.q1.options.o3'),
        emojiOpt('🦁', 'animals.q1.options.o4'),
      ],
      correctIndex: 1,
    },
    {
      promptKey: 'animals.q2.prompt',
      options: [
        emojiOpt('🐟', 'animals.q2.options.o1'),
        emojiOpt('🐘', 'animals.q2.options.o2'),
        emojiOpt('🐦', 'animals.q2.options.o3'),
        emojiOpt('🐢', 'animals.q2.options.o4'),
      ],
      correctIndex: 2,
    },
    {
      promptKey: 'animals.q3.prompt',
      options: [
        emojiOpt('🐬', 'animals.q3.options.o1'),
        emojiOpt('🐱', 'animals.q3.options.o2'),
        emojiOpt('🐶', 'animals.q3.options.o3'),
        emojiOpt('🐔', 'animals.q3.options.o4'),
      ],
      correctIndex: 0,
    },
  ],
  // Objects — everyday things, plus the single photo question in the bank
  [
    {
      promptKey: 'objects.q1.prompt',
      options: [
        emojiOpt('⚽', 'objects.q1.options.o1'),
        emojiOpt('📦', 'objects.q1.options.o2'),
        emojiOpt('📏', 'objects.q1.options.o3'),
        emojiOpt('📐', 'objects.q1.options.o4'),
      ],
      correctIndex: 0,
    },
    {
      promptKey: 'objects.q2.prompt',
      options: [
        emojiOpt('🎲', 'objects.q2.options.o1'),
        emojiOpt('🌙', 'objects.q2.options.o2'),
        emojiOpt('🥚', 'objects.q2.options.o3'),
        emojiOpt('🍩', 'objects.q2.options.o4'),
      ],
      correctIndex: 0,
    },
    {
      promptKey: 'objects.q3.prompt',
      options: [
        emojiOpt('🐱', 'objects.q3.options.o1'),
        emojiOpt('🐟', 'objects.q3.options.o2'),
        {
          visual: {
            kind: 'image',
            uri: 'https://picsum.photos/id/237/300/300',
            fallbackEmoji: '🐶',
          },
          a11yKey: 'objects.q3.options.o3',
        },
        emojiOpt('🐦', 'objects.q3.options.o4'),
      ],
      correctIndex: 2,
    },
  ],
];

/**
 * Deterministic set selection: a stable string hash of the lesson id. No storage
 * involved, and the picsum ids are stable, so a lesson keeps its questions forever.
 */
export function getQuestionSet(lessonId: string): QuestionSet {
  // questionSets is a non-empty literal, so the index is always valid.
  return questionSets[hashString(lessonId) % questionSets.length]!;
}

/** Exposed for data-integrity tests only. */
export const allQuestionSets = questionSets;
