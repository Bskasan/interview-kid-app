import { colors } from '@/theme';

/**
 * Local mock quiz content (the brief allows local data for the exercise).
 * Turkish, ages 5–8: pre-readers first — every option is a big visual (emoji,
 * drawn shape or photo) with an optional short label. Five sets; a lesson picks
 * one deterministically from its id (ADR 0015), so the same lesson always asks
 * the same questions — retakes stay comparable.
 */
export type ShapeName = 'circle' | 'square' | 'triangle' | 'star';

export type OptionVisual =
  | { kind: 'emoji'; value: string }
  | { kind: 'shape'; shape: ShapeName; color: keyof typeof colors }
  // fallbackEmoji keeps an image option answerable offline or on load error.
  | { kind: 'image'; uri: string; fallbackEmoji: string };

/**
 * Either a visible label exists (it doubles as the spoken label), or an explicit
 * a11yLabel is required — a non-empty description is a compile-time guarantee.
 */
export type AnswerOptionData =
  | { label: string; a11yLabel?: string; visual?: OptionVisual }
  | { label?: undefined; a11yLabel: string; visual: OptionVisual };

export type Question = {
  prompt: string;
  /** Exactly four answer options. */
  options: readonly [AnswerOptionData, AnswerOptionData, AnswerOptionData, AnswerOptionData];
  correctIndex: 0 | 1 | 2 | 3;
};

export type QuestionSet = readonly Question[];

export const QUESTIONS_PER_ATTEMPT = 3;
export const SECONDS_PER_QUESTION = 15;

/** What a screen reader announces for an option. Total by construction. */
export function optionA11yLabel(option: AnswerOptionData): string {
  if (option.label !== undefined) {
    return option.a11yLabel ?? option.label;
  }
  return option.a11yLabel;
}

// Exhaustive over the palette so a new color token forces a Turkish name.
const TURKISH_COLOR: Record<keyof typeof colors, string> = {
  background: 'Krem',
  surface: 'Beyaz',
  ink: 'Siyah',
  muted: 'Gri',
  primary: 'Yeşil',
  primaryDark: 'Koyu yeşil',
  sky: 'Mavi',
  skyDark: 'Koyu mavi',
  sun: 'Sarı',
  sunDark: 'Koyu sarı',
  coral: 'Kırmızı',
  coralDark: 'Koyu kırmızı',
  grape: 'Mor',
  border: 'Bej',
};

const TURKISH_SHAPE: Record<ShapeName, string> = {
  circle: 'daire',
  square: 'kare',
  triangle: 'üçgen',
  star: 'yıldız',
};

const shapeOpt = (shape: ShapeName, color: keyof typeof colors): AnswerOptionData => ({
  visual: { kind: 'shape', shape, color },
  a11yLabel: `${TURKISH_COLOR[color]} ${TURKISH_SHAPE[shape]}`,
});

const emojiOpt = (value: string, label: string): AnswerOptionData => ({
  visual: { kind: 'emoji', value },
  label,
});

const textOpt = (label: string): AnswerOptionData => ({ label });

const questionSets: readonly QuestionSet[] = [
  // Shapes — find the named shape among drawn shapes
  [
    {
      prompt: 'Hangisi üçgen?',
      options: [
        shapeOpt('square', 'sky'),
        shapeOpt('triangle', 'coral'),
        shapeOpt('circle', 'sun'),
        shapeOpt('star', 'grape'),
      ],
      correctIndex: 1,
    },
    {
      prompt: 'Hangisi yıldız?',
      options: [
        shapeOpt('star', 'sun'),
        shapeOpt('circle', 'sky'),
        shapeOpt('square', 'grape'),
        shapeOpt('triangle', 'primary'),
      ],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi daire?',
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
      prompt: 'Mavi olan hangisi?',
      options: [
        shapeOpt('circle', 'primary'),
        shapeOpt('circle', 'sun'),
        shapeOpt('circle', 'sky'),
        shapeOpt('circle', 'grape'),
      ],
      correctIndex: 2,
    },
    {
      prompt: 'Sarı olan hangisi?',
      options: [
        shapeOpt('square', 'sun'),
        shapeOpt('square', 'grape'),
        shapeOpt('square', 'coral'),
        shapeOpt('square', 'sky'),
      ],
      correctIndex: 0,
    },
    {
      prompt: 'Yeşil olan hangisi?',
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
      prompt: 'Kaç elma var? 🍎🍎🍎',
      options: [textOpt('2'), textOpt('3'), textOpt('4'), textOpt('5')],
      correctIndex: 1,
    },
    {
      prompt: 'Kaç yıldız var? ⭐⭐',
      options: [textOpt('4'), textOpt('3'), textOpt('2'), textOpt('1')],
      correctIndex: 2,
    },
    {
      prompt: 'Kaç top var? ⚽⚽⚽⚽',
      options: [textOpt('3'), textOpt('5'), textOpt('4'), textOpt('6')],
      correctIndex: 2,
    },
  ],
  // Animals — emoji visuals with a short word underneath
  [
    {
      prompt: 'Hangisi miyav der?',
      options: [
        emojiOpt('🐄', 'İnek'),
        emojiOpt('🐱', 'Kedi'),
        emojiOpt('🐑', 'Koyun'),
        emojiOpt('🦁', 'Aslan'),
      ],
      correctIndex: 1,
    },
    {
      prompt: 'Hangisi uçar?',
      options: [
        emojiOpt('🐟', 'Balık'),
        emojiOpt('🐘', 'Fil'),
        emojiOpt('🐦', 'Kuş'),
        emojiOpt('🐢', 'Kaplumbağa'),
      ],
      correctIndex: 2,
    },
    {
      prompt: 'Hangisi suda yaşar?',
      options: [
        emojiOpt('🐬', 'Yunus'),
        emojiOpt('🐱', 'Kedi'),
        emojiOpt('🐶', 'Köpek'),
        emojiOpt('🐔', 'Tavuk'),
      ],
      correctIndex: 0,
    },
  ],
  // Objects — everyday things, plus the single photo question in the bank
  [
    {
      prompt: 'Hangisi yuvarlak?',
      options: [
        emojiOpt('⚽', 'Top'),
        emojiOpt('📦', 'Kutu'),
        emojiOpt('📏', 'Cetvel'),
        emojiOpt('📐', 'Gönye'),
      ],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi kare?',
      options: [
        emojiOpt('🎲', 'Zar'),
        emojiOpt('🌙', 'Ay'),
        emojiOpt('🥚', 'Yumurta'),
        emojiOpt('🍩', 'Simit'),
      ],
      correctIndex: 0,
    },
    {
      prompt: 'Hangisi köpek?',
      options: [
        emojiOpt('🐱', 'Kedi'),
        emojiOpt('🐟', 'Balık'),
        {
          visual: {
            kind: 'image',
            uri: 'https://picsum.photos/id/237/300/300',
            fallbackEmoji: '🐶',
          },
          a11yLabel: 'Köpek fotoğrafı',
        },
        emojiOpt('🐦', 'Kuş'),
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
  let hash = 0;
  for (const char of lessonId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  // questionSets is a non-empty literal, so the index is always valid.
  return questionSets[hash % questionSets.length]!;
}

/** Exposed for data-integrity tests only. */
export const allQuestionSets = questionSets;
